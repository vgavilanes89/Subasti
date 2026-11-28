import { getSql } from '../_lib/db.js';
import { getActiveUserId } from '../_lib/session.js';
import { toPublicOrder, getOrderById } from '../_lib/orders.js';
import { ORDER_STATUS } from '../../src/data/escrow.js';
import { createNotification, getUserContact } from '../_lib/notify.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await getActiveUserId(req);
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
  if (order.status !== ORDER_STATUS.AWAITING_CONFIRMATION) {
    return res.status(409).json({ error: 'CLAIM_WINDOW_CLOSED' });
  }
  // The buyer has 48 hours from marking the item received. After that the sale
  // is final: no more claims, even if the money has not been released yet.
  if (order.confirmation_due_at && Date.now() > new Date(order.confirmation_due_at).getTime()) {
    return res.status(409).json({ error: 'CLAIM_WINDOW_CLOSED' });
  }

  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (!reason) {
    return res.status(400).json({ error: 'REASON_REQUIRED' });
  }

  const rows = await sql`
    UPDATE orders SET
      status = ${ORDER_STATUS.CLAIM_PENDING},
      claim_reason = ${reason},
      claim_filed_at = to_timestamp(${Date.now()} / 1000.0)
    WHERE id = ${order.id}
      AND status = ${ORDER_STATUS.AWAITING_CONFIRMATION}
      AND (confirmation_due_at IS NULL OR confirmation_due_at >= now())
    RETURNING *
  `;
  // Guarded in the UPDATE too: a release (or the deadline) landing at the same
  // moment must win, rather than this claim reopening a completed order.
  if (!rows[0]) {
    return res.status(409).json({ error: 'CLAIM_WINDOW_CLOSED' });
  }

  const seller = await getUserContact(sql, order.seller_id);
  if (seller) {
    await createNotification({
      sql,
      userId: order.seller_id,
      type: 'order_status',
      title: `El comprador presentó un reclamo sobre "${order.item_title}"`,
      body: reason,
      link: '/profile?tab=selling',
      email: seller.email,
      name: seller.name,
    }).catch((err) => console.error('Claim notification failed:', err.message));
  }

  return res.status(200).json(toPublicOrder(rows[0]));
}
