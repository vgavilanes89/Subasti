import { getSql } from '../_lib/db.js';
import { getActiveUserId } from '../_lib/session.js';
import { getStripe } from '../_lib/stripe.js';
import { ensureStripeCustomer } from '../_lib/wallet.js';

// Starts "save a card to my account": returns a client secret for a Stripe
// SetupIntent. The card number is typed into Stripe's own form in the browser
// and never touches our servers; when Stripe confirms it, the card is attached
// to this user's Stripe customer.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await getActiveUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const sql = getSql();
    const customerId = await ensureStripeCustomer(sql, userId);
    if (!customerId) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    const intent = await getStripe().setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'on_session',
      metadata: { userId: String(userId) },
    });
    return res.status(200).json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error('Setup intent failed:', err.message);
    return res.status(503).json({ error: 'CARDS_UNAVAILABLE' });
  }
}
