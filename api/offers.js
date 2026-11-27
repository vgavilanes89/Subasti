import { randomUUID } from 'crypto';
import { getSql } from './_lib/db.js';
import { getUserIdFromRequest } from './_lib/session.js';
import { generateOrderId, toPublicOrder } from './_lib/orders.js';
import { createNotification, getUserContact, formatMoney } from './_lib/notify.js';
import { ESCROW_WINDOW_MS, ORDER_STATUS } from '../src/data/escrow.js';

// Second-chance offers. An auction that ends below its reserve price makes no
// sale; the seller may then offer the item to the highest bidder, who accepts
// (an order is created, to be paid within 48 hours) or declines.
//
//   GET  ?role=seller   the seller's auctions that missed the reserve
//   GET  ?role=buyer    offers waiting on me
//   POST {action:'create', itemId, amount}          seller
//   POST {action:'withdraw', offerId}               seller
//   POST {action:'accept', offerId, fulfillment}    bidder
//   POST {action:'decline', offerId}                bidder
const OFFER_WINDOW_MS = 48 * 60 * 60 * 1000;
const LOOKBACK_DAYS = 30;

const isExpired = (o) => o.status === 'pending' && new Date(o.expires_at).getTime() < Date.now();
const offerState = (o) => (isExpired(o) ? 'expired' : o.status);

// Auctions of this seller that ended below reserve and weren't sold any other way.
async function sellerList(sql, userId) {
  const items = await sql`
    SELECT i.*, u.profile_name AS bidder_name
    FROM items i LEFT JOIN users u ON u.id::text = i.highest_bidder_id
    WHERE i.seller_id = ${userId} AND i.sale_type = 'auc'
      AND i.end_at < now() AND i.end_at > now() - (${LOOKBACK_DAYS} * interval '1 day')
      AND i.reserve_price IS NOT NULL AND i.current_bid < i.reserve_price
      AND i.highest_bidder_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.item_id = i.id AND o.order_type = 'buy_now')
    ORDER BY i.end_at DESC
  `;
  if (items.length === 0) return [];
  const offers = await sql`
    SELECT * FROM second_chance_offers WHERE seller_id = ${userId} ORDER BY created_at DESC
  `;
  return items.map((i) => {
    const o = offers.find((x) => x.item_id === i.id);
    return {
      itemId: i.id,
      title: i.title,
      image: i.image,
      currency: i.currency,
      highestBid: Number(i.current_bid),
      reservePrice: Number(i.reserve_price),
      bidderName: i.bidder_name || '',
      endedAt: new Date(i.end_at).getTime(),
      offer: o ? { id: o.id, amount: Number(o.amount), status: offerState(o), expiresAt: new Date(o.expires_at).getTime() } : null,
    };
  });
}

async function buyerList(sql, userId) {
  const rows = await sql`
    SELECT o.*, i.title, i.image, i.shipping_ship, i.shipping_local, i.shipping_cost
    FROM second_chance_offers o JOIN items i ON i.id = o.item_id
    WHERE o.bidder_id = ${userId} AND o.status = 'pending' AND o.expires_at > now()
    ORDER BY o.expires_at ASC
  `;
  return rows.map((o) => ({
    id: o.id,
    itemId: o.item_id,
    title: o.title,
    image: o.image,
    amount: Number(o.amount),
    currency: o.currency,
    expiresAt: new Date(o.expires_at).getTime(),
    shippingShip: o.shipping_ship,
    shippingLocal: o.shipping_local,
    shippingCost: Number(o.shipping_cost) || 0,
  }));
}

const notify = async (sql, userId, title, body, link) => {
  try {
    const contact = await getUserContact(sql, userId);
    await createNotification({ sql, userId, type: 'order_status', title, body, link, email: contact?.email, name: contact?.name });
  } catch (err) {
    console.error('Offer notification failed:', err.message);
  }
};

export default async function handler(req, res) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const sql = getSql();

  if (req.method === 'GET') {
    const role = req.query.role === 'seller' ? 'seller' : 'buyer';
    try {
      return res.status(200).json(role === 'seller' ? await sellerList(sql, userId) : await buyerList(sql, userId));
    } catch (err) {
      // e.g. the table is not there yet: the dashboards must still work.
      console.error('Listing offers failed:', err.message);
      return res.status(200).json([]);
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const action = body.action;

  try {
    if (action === 'create') {
      const itemId = typeof body.itemId === 'string' ? body.itemId : '';
      const amount = Number(body.amount);
      const item = (await sql`SELECT * FROM items WHERE id = ${itemId}`)[0];
      if (!item || item.seller_id !== userId) return res.status(404).json({ error: 'Item not found' });

      const eligible = item.sale_type === 'auc'
        && item.end_at && new Date(item.end_at).getTime() < Date.now()
        && item.reserve_price !== null && Number(item.current_bid) < Number(item.reserve_price)
        && item.highest_bidder_id;
      if (!eligible) return res.status(409).json({ error: 'NOT_ELIGIBLE' });
      const sold = await sql`SELECT 1 FROM orders WHERE item_id = ${itemId} AND status <> ${ORDER_STATUS.CANCELLED} LIMIT 1`;
      if (sold[0]) return res.status(409).json({ error: 'ALREADY_SOLD' });
      // The bidder already agreed to pay their own bid, so the offer can't be below it.
      if (!Number.isFinite(amount) || amount < Number(item.current_bid)) {
        return res.status(400).json({ error: 'AMOUNT_TOO_LOW' });
      }

      const id = `offer_${randomUUID()}`;
      const inserted = await sql`
        INSERT INTO second_chance_offers (id, item_id, seller_id, bidder_id, amount, currency, expires_at)
        VALUES (${id}, ${itemId}, ${userId}, ${item.highest_bidder_id}, ${amount}, ${item.currency || 'CRC'},
                to_timestamp(${Date.now() + OFFER_WINDOW_MS} / 1000.0))
        ON CONFLICT (item_id) WHERE status <> 'withdrawn' DO NOTHING
        RETURNING id
      `;
      if (!inserted[0]) return res.status(409).json({ error: 'ALREADY_OFFERED' });

      await notify(sql, item.highest_bidder_id,
        `Segunda oportunidad: "${item.title}"`,
        `El vendedor te ofrece el artículo por ${formatMoney(amount, item.currency)}. Tienes 48 horas para aceptar o rechazar en Perfil → Compras.`,
        '/profile?tab=buying');
      return res.status(201).json(await sellerList(sql, userId));
    }

    const offerId = typeof body.offerId === 'string' ? body.offerId : '';
    const offer = (await sql`SELECT * FROM second_chance_offers WHERE id = ${offerId}`)[0];

    if (action === 'withdraw') {
      if (!offer || offer.seller_id !== userId) return res.status(404).json({ error: 'Offer not found' });
      const updated = await sql`
        UPDATE second_chance_offers SET status = 'withdrawn', responded_at = now()
        WHERE id = ${offerId} AND status = 'pending' RETURNING item_id
      `;
      if (!updated[0]) return res.status(409).json({ error: 'OFFER_CLOSED' });
      const item = (await sql`SELECT title FROM items WHERE id = ${offer.item_id}`)[0];
      await notify(sql, offer.bidder_id, `Oferta retirada: "${item?.title || ''}"`, 'El vendedor retiró su oferta.', '/profile?tab=buying');
      return res.status(200).json(await sellerList(sql, userId));
    }

    // accept / decline: only the bidder the offer was made to.
    if (!offer || offer.bidder_id !== userId) return res.status(404).json({ error: 'Offer not found' });
    const item = (await sql`SELECT * FROM items WHERE id = ${offer.item_id}`)[0];
    if (!item) return res.status(404).json({ error: 'Item not found' });

    if (action === 'decline') {
      const updated = await sql`
        UPDATE second_chance_offers SET status = 'declined', responded_at = now()
        WHERE id = ${offerId} AND status = 'pending' AND expires_at > now() RETURNING id
      `;
      if (!updated[0]) return res.status(409).json({ error: 'OFFER_CLOSED' });
      await notify(sql, offer.seller_id, `Oferta rechazada: "${item.title}"`, 'El mejor postor rechazó tu oferta de segunda oportunidad.', '/profile?tab=selling');
      return res.status(200).json({ offers: await buyerList(sql, userId) });
    }

    if (action === 'accept') {
      const sold = await sql`SELECT 1 FROM orders WHERE item_id = ${item.id} AND status <> ${ORDER_STATUS.CANCELLED} LIMIT 1`;
      if (sold[0]) return res.status(409).json({ error: 'ALREADY_SOLD' });

      // Claim the offer first (once only), then create the order.
      const orderId = generateOrderId();
      const claimed = await sql`
        UPDATE second_chance_offers SET status = 'accepted', responded_at = now(), order_id = ${orderId}
        WHERE id = ${offerId} AND status = 'pending' AND expires_at > now() RETURNING id
      `;
      if (!claimed[0]) return res.status(409).json({ error: 'OFFER_CLOSED' });

      const wantsPickup = body.fulfillment === 'pickup' && item.shipping_local;
      const wantsShip = body.fulfillment === 'ship' && item.shipping_ship;
      const fulfillment = wantsPickup ? 'pickup' : wantsShip ? 'ship' : (item.shipping_ship ? 'ship' : 'pickup');
      const shippingCost = fulfillment === 'ship' ? (Number(item.shipping_cost) || 0) : 0;
      // Ship to the buyer's default saved address, when they have one.
      let address = null;
      if (fulfillment === 'ship') {
        const a = (await sql`SELECT * FROM saved_addresses WHERE user_id = ${userId} AND is_default = TRUE LIMIT 1`.catch(() => []))[0];
        if (a) address = { fullName: a.full_name, address: a.address, city: a.city, province: a.province, postalCode: a.postal_code, country: a.country };
      }

      const now = Date.now();
      const rows = await sql`
        INSERT INTO orders (
          id, buyer_id, seller_id, item_id, item_title, image, amount, currency,
          shipping_cost, status, fulfillment, order_type, payment_due_at, purchased_at, shipping_address
        ) VALUES (
          ${orderId}, ${userId}, ${offer.seller_id}, ${item.id}, ${item.title}, ${item.image},
          ${offer.amount}, ${offer.currency}, ${shippingCost}, ${ORDER_STATUS.PENDING_PAYMENT},
          ${fulfillment}, 'auction_won', to_timestamp(${now + ESCROW_WINDOW_MS} / 1000.0), to_timestamp(${now} / 1000.0),
          ${address ? JSON.stringify(address) : null}
        )
        ON CONFLICT (item_id, buyer_id) WHERE order_type = 'auction_won' DO NOTHING
        RETURNING *
      `;
      if (!rows[0]) return res.status(409).json({ error: 'ALREADY_SOLD' });

      await notify(sql, offer.seller_id, `¡Oferta aceptada! "${item.title}"`,
        `El mejor postor aceptó tu oferta de ${formatMoney(offer.amount, offer.currency)}. Tiene 48 horas para pagar; no envíes hasta que el pago esté asegurado.`,
        '/profile?tab=selling');
      return res.status(201).json({ order: toPublicOrder(rows[0]), offers: await buyerList(sql, userId) });
    }

    return res.status(400).json({ error: 'INVALID_REQUEST' });
  } catch (err) {
    console.error('Offer action failed:', err.message);
    return res.status(500).json({ error: 'REQUEST_FAILED' });
  }
}
