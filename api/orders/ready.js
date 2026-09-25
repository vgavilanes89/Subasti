import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';
import { toPublicOrder, getOrderById } from '../_lib/orders.js';
import { ORDER_STATUS } from '../../src/data/escrow.js';
import { createNotification, getUserContact } from '../_lib/notify.js';

// Seller-side action; see ship.js for why ownership isn't enforced yet.
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
  const orderId = typeof body.orderId === 'string' ? body.orderId : '';

  const sql = getSql();
  const order = await getOrderById(sql, orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (order.status !== ORDER_STATUS.ESCROW_HELD) {
    return res.status(409).json({ error: 'FUNDS_NOT_SECURED' });
  }

  const timeframe = typeof body.shippingTimeframe === 'string' ? body.shippingTimeframe.trim() : '';
  if (!timeframe) {
    return res.status(400).json({ error: 'TIMEFRAME_REQUIRED' });
  }

  const rows = await sql`
    UPDATE orders SET
      status = ${ORDER_STATUS.SHIPPED},
      shipping_timeframe = ${timeframe},
      shipped_at = to_timestamp(${Date.now()} / 1000.0)
    WHERE id = ${order.id}
    RETURNING *
  `;

  const buyer = await getUserContact(sql, order.buyer_id);
  if (buyer) {
    await createNotification({
      sql,
      userId: order.buyer_id,
      type: 'order_status',
      title: `Tu pedido "${order.item_title}" está listo para recoger`,
      body: `El vendedor lo tiene listo: ${timeframe}`,
      link: '/profile?tab=buying',
      email: buyer.email,
      name: buyer.name,
    }).catch((err) => console.error('Ready notification failed:', err.message));
  }

  return res.status(200).json(toPublicOrder(rows[0]));
}
