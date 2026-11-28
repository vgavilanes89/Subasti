import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';
import { toPublicItem } from '../_lib/items.js';
import {
  parseListingInput, listingState, loadListingRefs, deleteUnusedImages, saveUsedCondition, AUCTION_DAYS, DAY_MS,
} from '../_lib/listing.js';

// A seller managing their own listings.
//
//   GET                                  what may be edited or removed right now
//   POST {action:'update', id, ...form}  edit (auctions only before the first bid)
//   POST {action:'remove', id}           take the listing down
export default async function handler(req, res) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const sql = getSql();

  if (req.method === 'GET') {
    const rows = (await sql`SELECT * FROM items WHERE seller_id = ${userId}`).filter((r) => !r.removed_at);
    const refs = await loadListingRefs(sql, rows.map((r) => r.id));
    const listings = {};
    for (const row of rows) {
      listings[row.id] = listingState(row, { orders: refs.ordersFor(row.id), pendingOffer: refs.hasPendingOffer(row.id) });
    }
    return res.status(200).json({ listings });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const id = typeof body.id === 'string' ? body.id : '';
  const row = (await sql`SELECT * FROM items WHERE id = ${id}`)[0];
  // Someone else's listing looks the same as a missing one.
  if (!row || row.removed_at || row.seller_id !== userId) {
    return res.status(404).json({ error: 'Item not found' });
  }
  const refs = await loadListingRefs(sql, [id]);
  const orders = refs.ordersFor(id);
  const state = listingState(row, { orders, pendingOffer: refs.hasPendingOffer(id) });
  const oldImages = [row.image, ...(Array.isArray(row.images) ? row.images : [])];

  if (body.action === 'remove') {
    if (state.removeBlocked) return res.status(409).json({ error: state.removeBlocked });

    const referenced = orders.length > 0 || Number(row.bids) > 0 || (await sql`
      SELECT 1 FROM bid_history WHERE item_id = ${id}
      UNION ALL SELECT 1 FROM message_threads WHERE item_id = ${id}
      UNION ALL SELECT 1 FROM second_chance_offers WHERE item_id = ${id}
      LIMIT 1
    `).length > 0;

    // Both are guarded on the bid count, so a bid landing right now wins.
    let done;
    if (referenced) {
      try {
        done = await sql`UPDATE items SET removed_at = now() WHERE id = ${id} AND bids IS NOT DISTINCT FROM ${row.bids} RETURNING id`;
      } catch (err) {
        console.error('Removing a listing failed (has sql/025 been run?):', err.message);
        return res.status(503).json({ error: 'REMOVE_UNAVAILABLE' });
      }
    } else {
      done = await sql`DELETE FROM items WHERE id = ${id} AND bids IS NOT DISTINCT FROM ${row.bids} RETURNING id`;
      if (done[0]) {
        await sql`DELETE FROM favorites WHERE item_id = ${id}`;
        await deleteUnusedImages(sql, oldImages);
      }
    }
    if (!done[0]) return res.status(409).json({ error: 'LISTING_CHANGED' });
    return res.status(200).json({ id });
  }

  if (body.action !== 'update') {
    return res.status(400).json({ error: 'INVALID_REQUEST' });
  }
  if (state.editBlocked) return res.status(409).json({ error: state.editBlocked });

  const parsed = parseListingInput(body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const v = parsed.value;
  // How a listing sells is fixed once it is published.
  const isAuction = row.sale_type === 'auc';

  let endAt = row.end_at;
  let quantity = v.quantity;
  if (isAuction) {
    quantity = row.quantity;
    const days = Number(body.auctionDuration);
    if (AUCTION_DAYS.includes(days)) {
      endAt = new Date(Date.now() + days * DAY_MS);
    } else if (!row.end_at || new Date(row.end_at).getTime() <= Date.now()) {
      // An ended auction is only worth editing if it starts running again.
      return res.status(400).json({ error: 'DURATION_REQUIRED' });
    }
  }

  const updated = await sql`
    UPDATE items SET
      title = ${v.title}, description = ${v.description}, category = ${v.category}, sub_category = ${v.subCategory},
      currency = ${v.currency}, price = ${v.price}, image = ${v.images[0]}, images = ${JSON.stringify(v.images)},
      condition = ${v.condition}, condition_detail = ${v.conditionDetail}, quantity = ${quantity},
      shipping_ship = ${v.shippingShip}, shipping_local = ${v.shippingLocal}, shipping_cost = ${v.shippingCost},
      buy_now_price = ${isAuction ? v.buyNowPrice : null},
      reserve_price = ${isAuction ? v.reservePrice : null},
      current_bid = ${isAuction ? v.price : null},
      end_at = ${endAt},
      attributes = ${JSON.stringify(v.attributes)}, payment_methods = ${JSON.stringify(v.paymentMethods)}
    WHERE id = ${id} AND bids IS NOT DISTINCT FROM ${row.bids}
    RETURNING *
  `;
  if (!updated[0]) return res.status(409).json({ error: 'LISTING_CHANGED' });

  await deleteUnusedImages(sql, oldImages.filter((u) => !v.images.includes(u)));
  const saved = await saveUsedCondition(sql, updated[0], v.usedCondition);
  return res.status(200).json(toPublicItem(saved, { includeReserve: true }));
}
