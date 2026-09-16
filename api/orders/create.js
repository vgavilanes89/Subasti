import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';
import { toPublicOrder, generateOrderId } from '../_lib/orders.js';
import { fetchItemById } from '../../src/api/items.js';
import { ESCROW_WINDOW_MS, ORDER_STATUS } from '../../src/data/escrow.js';

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
  const cart = Array.isArray(body.items) ? body.items : [];
  const fulfillment = body.fulfillment === 'pickup' ? 'pickup' : 'ship';
  const paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod : null;

  if (cart.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  // Recompute everything from the server's own item data rather than trusting
  // whatever price/seller the client submitted at checkout.
  const resolved = [];
  for (const cartItem of cart) {
    const item = fetchItemById(cartItem.id);
    if (!item) {
      return res.status(400).json({ error: `Item ${cartItem.id} not found` });
    }
    const qty = Number.isFinite(cartItem.qty) && cartItem.qty > 0 ? Math.floor(cartItem.qty) : 1;
    resolved.push({ item, qty });
  }

  const now = Date.now();
  const sql = getSql();
  const inserted = [];
  for (const { item, qty } of resolved) {
    const unitPrice = item.buyNowPrice || item.price;
    const id = generateOrderId();
    const amount = unitPrice * qty;
    const shippingCost = fulfillment === 'ship' ? (item.shippingCost || 0) : 0;
    const shipByAt = now + ESCROW_WINDOW_MS;

    const rows = await sql`
      INSERT INTO orders (
        id, buyer_id, seller_id, item_id, item_title, image, amount, currency,
        shipping_cost, status, fulfillment, order_type, payment_method,
        purchased_at, escrow_held_at, ship_by_at
      ) VALUES (
        ${id}, ${userId}, ${item.sellerId}, ${item.id}, ${item.title}, ${item.image},
        ${amount}, ${item.currency || 'CRC'}, ${shippingCost}, ${ORDER_STATUS.ESCROW_HELD},
        ${fulfillment}, 'buy_now', ${paymentMethod},
        to_timestamp(${now} / 1000.0), to_timestamp(${now} / 1000.0), to_timestamp(${shipByAt} / 1000.0)
      )
      RETURNING *
    `;
    inserted.push(toPublicOrder(rows[0]));
  }

  return res.status(201).json(inserted);
}
