import { getSql } from '../_lib/db.js';
import { getRequestingAdmin } from '../_lib/admin.js';
import { getOrderById, toPublicOrder } from '../_lib/orders.js';
import { createNotification, getUserContact, formatMoney } from '../_lib/notify.js';
import { ORDER_STATUS } from '../../src/data/escrow.js';

// An admin releases the held money to the seller. Used when the item has been
// received (within the escrow window) or when buyer and seller have settled it
// between themselves. The order becomes 'completed', which adds it to the
// seller's balance in Payouts — the admin then pays the seller out as usual.
// Orders with an open claim are resolved through resolve-claim instead.
const RELEASABLE = [ORDER_STATUS.ESCROW_HELD, ORDER_STATUS.SHIPPED, ORDER_STATUS.AWAITING_CONFIRMATION];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const admin = await getRequestingAdmin(req);
  if (!admin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const orderId = typeof body.orderId === 'string' ? body.orderId : '';

  try {
    const sql = getSql();
    const order = await getOrderById(sql, orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!RELEASABLE.includes(order.status)) return res.status(409).json({ error: 'NOT_RELEASABLE' });

    const rows = await sql`
      UPDATE orders SET
        status = ${ORDER_STATUS.COMPLETED},
        funds_released_at = to_timestamp(${Date.now()} / 1000.0),
        resolved_by = ${String(admin.id)}
      WHERE id = ${order.id} AND status = ANY(${RELEASABLE})
      RETURNING *
    `;
    if (!rows[0]) return res.status(409).json({ error: 'NOT_RELEASABLE' });

    const [seller, buyer] = await Promise.all([getUserContact(sql, order.seller_id), getUserContact(sql, order.buyer_id)]);
    const amount = formatMoney(order.amount, order.currency);
    if (seller) {
      await createNotification({
        sql,
        userId: order.seller_id,
        type: 'order_status',
        title: `¡Venta completada! Fondos liberados por "${order.item_title}"`,
        body: `Subasti liberó ${amount} a tu favor. Asegúrate de tener tu cuenta para recibir pagos en tu perfil (pestaña Ventas).`,
        link: '/profile?tab=selling',
        email: seller.email,
        name: seller.name,
      }).catch((err) => console.error('Admin release seller notification failed:', err.message));
    }
    if (buyer) {
      await createNotification({
        sql,
        userId: order.buyer_id,
        type: 'order_status',
        title: `Fondos liberados al vendedor: "${order.item_title}"`,
        body: 'Subasti liberó el pago al vendedor, por lo que tu pedido quedó completado.',
        link: '/profile?tab=buying',
        email: buyer.email,
        name: buyer.name,
      }).catch((err) => console.error('Admin release buyer notification failed:', err.message));
    }

    return res.status(200).json(toPublicOrder(rows[0]));
  } catch (err) {
    console.error('Admin release failed:', err.message);
    return res.status(500).json({ error: 'REQUEST_FAILED' });
  }
}
