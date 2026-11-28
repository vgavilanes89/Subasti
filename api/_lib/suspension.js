import { createNotification, getUserContact, formatMoney } from './notify.js';
import { generateOrderId } from './orders.js';

// What happens to a suspended account's auctions. Wins it hasn't paid for are
// cancelled, so the seller isn't stuck. Its bids on auctions still running are
// cancelled. The rows stay in bid_history, marked, and the
// price drops back to the best remaining bid. Reinstating the account does not
// bring either back. Other bids on ended auctions are left as they are.

const MAX_ATTEMPTS = 3;

const tell = async (sql, userId, title, body, itemId) => {
  try {
    const contact = await getUserContact(sql, userId);
    await createNotification({
      sql, userId, type: 'order_status', title, body, link: `/item/${itemId}`, email: contact?.email, name: contact?.name,
    });
  } catch (err) {
    console.error('Cancelled-bid notification failed:', err.message);
  }
};

async function repriceAuction(sql, itemId, userId, removed) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const item = (await sql`SELECT * FROM items WHERE id = ${itemId}`)[0];
    if (!item) return;

    // Only touch the price if they were leading. If someone else is, their bid
    // stands, and may not even have reached bid_history yet.
    const wasLeading = item.highest_bidder_id === userId;
    let amount = item.current_bid;
    let leader = item.highest_bidder_id;
    if (wasLeading) {
      const next = (await sql`
        SELECT h.bidder_id, h.amount FROM bid_history h
        WHERE h.item_id = ${itemId} AND h.cancelled_at IS NULL AND h.bidder_id <> ${userId}
          AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id::text = h.bidder_id AND u.is_suspended)
        ORDER BY h.amount DESC, h.placed_at ASC LIMIT 1
      `)[0];
      amount = next ? next.amount : item.price;
      leader = next ? next.bidder_id : null;
    }
    const count = leader ? Math.max(0, Number(item.bids) - removed) : 0;

    // Guarded on what was just read, so a bid landing now isn't overwritten.
    const updated = await sql`
      UPDATE items SET current_bid = ${amount}, highest_bidder_id = ${leader}, bids = ${count}
      WHERE id = ${itemId}
        AND current_bid IS NOT DISTINCT FROM ${item.current_bid}
        AND bids IS NOT DISTINCT FROM ${item.bids}
        AND highest_bidder_id IS NOT DISTINCT FROM ${item.highest_bidder_id}
      RETURNING id
    `;
    if (!updated[0]) continue;

    if (wasLeading) {
      const price = formatMoney(amount, item.currency);
      if (leader) {
        await tell(sql, leader, 'Vuelves a ser el mejor postor',
          `Se anularon pujas en "${item.title}". Tu puja de ${price} es otra vez la más alta.`, itemId);
      }
      await tell(sql, item.seller_id, 'Pujas anuladas en tu subasta',
        `Se anularon las pujas de una cuenta suspendida en "${item.title}". ${leader ? `La puja actual es ${price}.` : 'Ya no tiene pujas.'}`, itemId);
    }
    return;
  }
  throw new Error(`Could not reprice auction ${itemId}`);
}

// Returns how many auctions were changed.
export async function cancelRunningBids(sql, userId) {
  const cancelled = await sql`
    UPDATE bid_history b SET cancelled_at = now()
    FROM items i
    WHERE i.id = b.item_id AND b.bidder_id = ${userId} AND b.cancelled_at IS NULL
      AND i.sale_type = 'auc' AND i.end_at > now()
    RETURNING b.item_id
  `;
  const removed = new Map();
  for (const row of cancelled) removed.set(row.item_id, (removed.get(row.item_id) || 0) + 1);

  // Also any they lead from before bids were recorded one by one.
  const led = await sql`
    SELECT id FROM items WHERE highest_bidder_id = ${userId} AND sale_type = 'auc' AND end_at > now()
  `;
  const ids = new Set([...removed.keys(), ...led.map((r) => r.id)]);
  for (const itemId of ids) await repriceAuction(sql, itemId, userId, removed.get(itemId) || 0);
  return ids.size;
}

const tellSeller = async (sql, sellerId, title, itemId) => {
  try {
    const contact = await getUserContact(sql, sellerId);
    await createNotification({
      sql, userId: sellerId, type: 'order_status',
      title: 'La venta de tu subasta no se concretó',
      body: `La cuenta ganadora de "${title}" fue suspendida. Revisa en Perfil → Ventas si puedes ofrecerla al siguiente postor, o elimina la publicación.`,
      link: '/profile?tab=selling', email: contact?.email, name: contact?.name,
    });
  } catch (err) {
    console.error('Released-win notification failed:', err.message);
  }
};

// Returns how many auctions were released to their sellers.
export async function releaseUnpaidWins(sql, userId) {
  // Wins already turned into an order but not paid. If they have reported a
  // SINPE transfer, the money may be there: that stays for an admin to check.
  const cancelled = await sql`
    UPDATE orders SET status = 'cancelled', cancelled_at = now()
    WHERE buyer_id = ${userId} AND order_type = 'auction_won' AND status = 'pending_payment'
      AND payment_reported_at IS NULL
    RETURNING id, item_id, seller_id, item_title
  `;

  // Wins with no order yet (one is only created when the winner comes to pay).
  // Recorded as a cancelled sale, which also stops them claiming it later.
  const unclaimed = await sql`
    SELECT i.* FROM items i
    WHERE i.highest_bidder_id = ${userId} AND i.sale_type = 'auc' AND i.end_at <= now()
      AND (i.reserve_price IS NULL OR i.current_bid >= i.reserve_price)
      AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.item_id = i.id AND (o.buyer_id = ${userId} OR o.order_type = 'buy_now'))
  `;
  const released = new Map(cancelled.map((o) => [o.item_id, { sellerId: o.seller_id, title: o.item_title }]));
  for (const item of unclaimed) {
    const inserted = await sql`
      INSERT INTO orders (
        id, buyer_id, seller_id, item_id, item_title, image, amount, currency,
        shipping_cost, status, fulfillment, order_type, purchased_at, cancelled_at
      ) VALUES (
        ${generateOrderId()}, ${userId}, ${item.seller_id}, ${item.id}, ${item.title}, ${item.image},
        ${item.current_bid}, ${item.currency || 'CRC'}, 0, 'cancelled',
        ${item.shipping_ship ? 'ship' : 'pickup'}, 'auction_won', now(), now()
      )
      ON CONFLICT (item_id, buyer_id) WHERE order_type = 'auction_won' DO NOTHING
      RETURNING id
    `;
    if (inserted[0]) released.set(item.id, { sellerId: item.seller_id, title: item.title });
  }

  // Offers made to them: unanswered ones, and accepted ones just cancelled
  // above. Withdrawing frees the seller to offer someone else.
  const withdrawn = await sql`
    UPDATE second_chance_offers SET status = 'withdrawn', responded_at = now()
    WHERE bidder_id = ${userId}
      AND (status = 'pending' OR (status = 'accepted' AND order_id = ANY(${cancelled.map((o) => o.id)})))
    RETURNING item_id, seller_id
  `;
  for (const offer of withdrawn) {
    if (released.has(offer.item_id)) continue;
    const item = (await sql`SELECT title FROM items WHERE id = ${offer.item_id}`)[0];
    released.set(offer.item_id, { sellerId: offer.seller_id, title: item?.title || '' });
  }

  for (const [itemId, sale] of released) await tellSeller(sql, sale.sellerId, sale.title, itemId);
  return released.size;
}

// For the two places an admin suspends someone. The suspension has already
// happened, so a failure here is reported rather than thrown.
export async function afterSuspension(sql, userId) {
  const outcome = { auctionsAffected: 0, winsReleased: 0, bidCancelFailed: false };
  // Separately, so one failing doesn't stop the other.
  try {
    outcome.auctionsAffected = await cancelRunningBids(sql, userId);
  } catch (err) {
    console.error('Cancelling bids failed (has sql/028 been run?):', err.message);
    outcome.bidCancelFailed = true;
  }
  try {
    outcome.winsReleased = await releaseUnpaidWins(sql, userId);
  } catch (err) {
    console.error('Releasing unpaid wins failed:', err.message);
    outcome.bidCancelFailed = true;
  }
  return outcome;
}
