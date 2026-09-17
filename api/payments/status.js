import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';
import { toPublicOrder } from '../_lib/orders.js';

// Polled by the checkout page after stripe.confirmPayment() resolves —
// the webhook is what actually creates the orders, and it can land a beat
// after the client-side confirmation does.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const paymentIntentId = typeof req.query.paymentIntentId === 'string' ? req.query.paymentIntentId : '';
  if (!paymentIntentId) {
    return res.status(400).json({ error: 'paymentIntentId is required' });
  }

  const sql = getSql();
  const rows = await sql`
    SELECT * FROM orders WHERE stripe_payment_intent_id = ${paymentIntentId} AND buyer_id = ${userId}
  `;
  return res.status(200).json({ ready: rows.length > 0, orders: rows.map(toPublicOrder) });
}
