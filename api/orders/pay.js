import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';
import { toPublicOrder, getOrderById } from '../_lib/orders.js';
import { ESCROW_WINDOW_MS, ORDER_STATUS } from '../../src/data/escrow.js';
import { createNotification, getUserContact } from '../_lib/notify.js';

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
  if (!order || order.buyer_id !== userId) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (order.status !== ORDER_STATUS.PENDING_PAYMENT) {
    return res.status(409).json({ error: 'NOT_PAYABLE' });
  }

  const paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod : 'card';
  const now = Date.now();

  const rows = await sql`
    UPDATE orders SET
      status = ${ORDER_STATUS.ESCROW_HELD},
      payment_method = ${paymentMethod},
      payment_due_at = NULL,
      escrow_held_at = to_timestamp(${now} / 1000.0),
      ship_by_at = to_timestamp(${now + ESCROW_WINDOW_MS} / 1000.0)
    WHERE id = ${order.id}
    RETURNING *
  `;

  const seller = await getUserContact(sql, order.seller_id);
  if (seller) {
    await createNotification({
      sql,
      userId: order.seller_id,
      type: 'order_status',
      title: `Pago recibido por "${order.item_title}"`,
      body: 'El pago está asegurado en depósito. Envía el artículo dentro de las próximas 48 horas.',
      link: '/profile?tab=selling',
      email: seller.email,
      name: seller.name,
    }).catch((err) => console.error('Pay notification failed:', err.message));
  }

  return res.status(200).json(toPublicOrder(rows[0]));
}
