import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';
import { toPublicOrder, getOrderById } from '../_lib/orders.js';
import { ORDER_STATUS } from '../../src/data/escrow.js';
import { createNotification, getUserContact } from '../_lib/notify.js';

// Seller-side action: a seller can cancel an order any time before the buyer's
// payment is received (i.e. while it is still pending_payment).
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
  if (!order || order.seller_id !== userId) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (order.status !== ORDER_STATUS.PENDING_PAYMENT) {
    return res.status(409).json({ error: 'CANNOT_CANCEL' });
  }
  const deadlinePassed = !order.payment_due_at || Date.now() > new Date(order.payment_due_at).getTime();

  // Guarded on status so a payment that lands at the same moment wins and the
  // cancel is refused, rather than cancelling an order that was just paid.
  const rows = await sql`
    UPDATE orders SET
      status = ${ORDER_STATUS.CANCELLED},
      cancelled_at = to_timestamp(${Date.now()} / 1000.0)
    WHERE id = ${order.id} AND status = ${ORDER_STATUS.PENDING_PAYMENT}
    RETURNING *
  `;
  if (!rows[0]) {
    return res.status(409).json({ error: 'CANNOT_CANCEL' });
  }

  const buyer = await getUserContact(sql, order.buyer_id);
  if (buyer) {
    await createNotification({
      sql,
      userId: order.buyer_id,
      type: 'order_status',
      title: `Tu pedido "${order.item_title}" fue cancelado`,
      body: deadlinePassed
        ? 'El vendedor canceló el pedido porque no se completó el pago a tiempo.'
        : 'El vendedor canceló el pedido antes de recibir el pago. No se te cobró nada.',
      link: '/profile?tab=buying',
      email: buyer.email,
      name: buyer.name,
    }).catch((err) => console.error('Cancel notification failed:', err.message));
  }

  return res.status(200).json(toPublicOrder(rows[0]));
}
