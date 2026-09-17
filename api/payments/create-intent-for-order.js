import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';
import { getStripe, toStripeAmount } from '../_lib/stripe.js';
import { getOrderById } from '../_lib/orders.js';
import { ORDER_STATUS } from '../../src/data/escrow.js';

// Pays off an EXISTING pending_payment order (an auction win) — unlike
// create-intent.js, there's no cart to resolve; the order already has the
// authoritative amount/currency from when it was created.
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

  const total = Number(order.amount) + Number(order.shipping_cost);
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.create({
    amount: toStripeAmount(total, order.currency),
    currency: order.currency.toLowerCase(),
    automatic_payment_methods: { enabled: true },
    metadata: { orderId: order.id, buyerId: userId },
  });

  return res.status(200).json({ clientSecret: intent.client_secret, paymentIntentId: intent.id });
}
