import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';
import { toPublicOrder, generateOrderId } from '../_lib/orders.js';
import { getItemById } from '../_lib/items.js';
import { ESCROW_WINDOW_MS, ORDER_STATUS } from '../../src/data/escrow.js';

// Items and bids are real Postgres rows now (see api/items/bid.js), so
// "who won at what price" is read straight from the item itself rather than
// trusted from the client — the client only tells us which item to settle.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const sql = getSql();
  const item = await getItemById(sql, body.itemId);
  if (!item || item.saleType !== 'auc') {
    return res.status(400).json({ error: 'Invalid auction item' });
  }
  if (!item.endAt || item.endAt >= Date.now()) {
    return res.status(400).json({ error: 'AUCTION_NOT_ENDED' });
  }
  if (item.highestBidderId !== userId) {
    return res.status(400).json({ error: 'NOT_HIGHEST_BIDDER' });
  }
  if (item.reservePrice && item.currentBid < item.reservePrice) {
    return res.status(400).json({ error: 'RESERVE_NOT_MET' });
  }

  const amount = item.currentBid;
  const wantsPickup = body.fulfillment === 'pickup' && item.shippingLocal;
  const wantsShip = body.fulfillment === 'ship' && item.shippingShip;
  const fulfillment = wantsPickup ? 'pickup' : wantsShip ? 'ship' : (item.shippingShip ? 'ship' : 'pickup');
  const shippingCost = fulfillment === 'ship' ? (item.shippingCost || 0) : 0;

  // Idempotent, and safe against a genuine race (two concurrent requests for
  // the same item+buyer — e.g. React StrictMode's double-invoked effect, two
  // open tabs, or a fast double-click): a partial unique index on
  // (item_id, buyer_id) WHERE order_type='auction_won' makes the insert
  // itself the guard, rather than a separate SELECT-then-INSERT that both
  // requests could pass before either one commits.
  const now = Date.now();
  const id = generateOrderId();
  const inserted = await sql`
    INSERT INTO orders (
      id, buyer_id, seller_id, item_id, item_title, image, amount, currency,
      shipping_cost, status, fulfillment, order_type, payment_due_at, purchased_at
    ) VALUES (
      ${id}, ${userId}, ${item.sellerId}, ${item.id}, ${item.title}, ${item.image},
      ${amount}, ${item.currency || 'CRC'}, ${shippingCost}, ${ORDER_STATUS.PENDING_PAYMENT},
      ${fulfillment}, 'auction_won', to_timestamp(${now + ESCROW_WINDOW_MS} / 1000.0), to_timestamp(${now} / 1000.0)
    )
    ON CONFLICT (item_id, buyer_id) WHERE order_type = 'auction_won' DO NOTHING
    RETURNING *
  `;

  if (inserted[0]) {
    return res.status(201).json(toPublicOrder(inserted[0]));
  }

  // Lost the race — an order already exists (from the other concurrent
  // request); return that one instead of erroring.
  const existing = await sql`
    SELECT * FROM orders WHERE item_id = ${item.id} AND buyer_id = ${userId} AND order_type = 'auction_won'
  `;
  return res.status(200).json(toPublicOrder(existing[0]));
}
