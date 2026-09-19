import { getSql } from '../_lib/db.js';
import { getRequestingAdmin } from '../_lib/admin.js';
import { getOrderById, toPublicOrder } from '../_lib/orders.js';
import { getStripe } from '../_lib/stripe.js';
import { ORDER_STATUS } from '../../src/data/escrow.js';

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
  const decision = body.decision === 'approve' || body.decision === 'deny' ? body.decision : null;
  if (!orderId || !decision) {
    return res.status(400).json({ error: 'orderId and decision are required' });
  }

  const sql = getSql();
  const order = await getOrderById(sql, orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (order.status !== ORDER_STATUS.CLAIM_PENDING) {
    return res.status(409).json({ error: 'NOT_CLAIM_PENDING' });
  }

  const now = Date.now();
  const resolvedBy = String(admin.id);

  if (decision === 'approve') {
    // Real charge to refund (card). SINPE orders never had one — same
    // status-flip trust level SINPE checkout already runs on.
    if (order.stripe_payment_intent_id) {
      const stripe = getStripe();
      await stripe.refunds.create({ payment_intent: order.stripe_payment_intent_id });
    }
    const rows = await sql`
      UPDATE orders SET
        status = ${ORDER_STATUS.REFUNDED},
        refunded_at = to_timestamp(${now} / 1000.0),
        resolved_by = ${resolvedBy}
      WHERE id = ${order.id}
      RETURNING *
    `;
    return res.status(200).json(toPublicOrder(rows[0]));
  }

  const rows = await sql`
    UPDATE orders SET
      status = ${ORDER_STATUS.COMPLETED},
      funds_released_at = to_timestamp(${now} / 1000.0),
      resolved_by = ${resolvedBy}
    WHERE id = ${order.id}
    RETURNING *
  `;
  return res.status(200).json(toPublicOrder(rows[0]));
}
