import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';
import { getStripe, toStripeAmount } from '../_lib/stripe.js';
import { getItemById } from '../_lib/items.js';

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

  if (cart.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  // Recompute everything from the server's own item data — never trust a
  // client-submitted price — same as the SINPE/mock checkout path.
  const sql = getSql();
  const resolved = [];
  for (const cartItem of cart) {
    const item = await getItemById(sql, cartItem.id);
    if (!item) {
      return res.status(400).json({ error: `Item ${cartItem.id} not found` });
    }
    const qty = Number.isFinite(cartItem.qty) && cartItem.qty > 0 ? Math.floor(cartItem.qty) : 1;
    resolved.push({ item, qty });
  }

  for (const { item, qty } of resolved) {
    if (item.saleType === 'buy' && item.quantity < qty) {
      return res.status(409).json({ error: 'OUT_OF_STOCK', itemId: item.id });
    }
  }

  const currencies = new Set(resolved.map(({ item }) => item.currency || 'CRC'));
  if (currencies.size > 1) {
    return res.status(400).json({ error: 'MIXED_CURRENCY_CART' });
  }
  const currency = [...currencies][0];

  let total = 0;
  const snapshot = resolved.map(({ item, qty }) => {
    const unitPrice = item.buyNowPrice || item.price;
    const shippingCost = fulfillment === 'ship' ? (item.shippingCost || 0) : 0;
    total += unitPrice * qty + shippingCost;
    return {
      id: item.id,
      qty,
      title: item.title,
      image: item.image,
      sellerId: item.sellerId,
      currency: item.currency || 'CRC',
      amount: unitPrice * qty,
      shippingCost,
    };
  });

  if (total <= 0) {
    return res.status(400).json({ error: 'Invalid order total' });
  }

  const stripe = getStripe();
  const intent = await stripe.paymentIntents.create({
    amount: toStripeAmount(total, currency),
    currency: currency.toLowerCase(),
    automatic_payment_methods: { enabled: true },
    metadata: { buyerId: userId },
  });

  await sql`
    INSERT INTO pending_checkouts (payment_intent_id, buyer_id, fulfillment, cart)
    VALUES (${intent.id}, ${userId}, ${fulfillment}, ${JSON.stringify(snapshot)})
    ON CONFLICT (payment_intent_id) DO UPDATE SET cart = EXCLUDED.cart, fulfillment = EXCLUDED.fulfillment
  `;

  return res.status(200).json({ clientSecret: intent.client_secret, paymentIntentId: intent.id });
}
