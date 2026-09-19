import { getSql } from '../_lib/db.js';
import { getStripe } from '../_lib/stripe.js';
import { generateOrderId } from '../_lib/orders.js';
import { ESCROW_WINDOW_MS, ORDER_STATUS } from '../../src/data/escrow.js';

// Stripe signs the exact raw bytes of the request; Vercel's default JSON
// parsing would re-serialize the body and break that signature, so this
// route reads the stream itself instead of touching req.body.
export const config = {
  api: {
    bodyParser: false,
  },
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function fulfillCheckout(sql, pending) {
  const cart = pending.cart; // jsonb column comes back already parsed
  const now = Date.now();
  const shipByAt = now + ESCROW_WINDOW_MS;

  for (const line of cart) {
    const id = generateOrderId();
    await sql`
      INSERT INTO orders (
        id, buyer_id, seller_id, item_id, item_title, image, amount, currency,
        shipping_cost, status, fulfillment, order_type, payment_method,
        stripe_payment_intent_id, purchased_at, escrow_held_at, ship_by_at
      ) VALUES (
        ${id}, ${pending.buyer_id}, ${line.sellerId}, ${line.id}, ${line.title}, ${line.image},
        ${line.amount}, ${line.currency}, ${line.shippingCost}, ${ORDER_STATUS.ESCROW_HELD},
        ${pending.fulfillment}, 'buy_now', 'card', ${pending.payment_intent_id},
        to_timestamp(${now} / 1000.0), to_timestamp(${now} / 1000.0), to_timestamp(${shipByAt} / 1000.0)
      )
    `;
    // Payment already succeeded, so this always fulfills — floor at 0 rather
    // than reject, since stock was already checked (best-effort) before the
    // charge in create-intent.js.
    if (typeof line.qty === 'number') {
      await sql`UPDATE items SET quantity = GREATEST(0, quantity - ${line.qty}) WHERE id = ${line.id} AND sale_type = 'buy'`;
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = getStripe();
  const rawBody = await readRawBody(req);
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature verification failed', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const paymentIntentId = paymentIntent.id;
    const existingOrderId = paymentIntent.metadata?.orderId;
    const sql = getSql();

    if (existingOrderId) {
      // Paying off an existing pending_payment order (an auction win), not a
      // new cart checkout. Guard on status so a webhook retry can't re-apply this.
      const now = Date.now();
      await sql`
        UPDATE orders SET
          status = ${ORDER_STATUS.ESCROW_HELD},
          payment_method = 'card',
          payment_due_at = NULL,
          escrow_held_at = to_timestamp(${now} / 1000.0),
          ship_by_at = to_timestamp(${now + ESCROW_WINDOW_MS} / 1000.0),
          stripe_payment_intent_id = ${paymentIntentId}
        WHERE id = ${existingOrderId} AND status = ${ORDER_STATUS.PENDING_PAYMENT}
      `;
    } else {
      // Idempotent: if orders already exist for this intent (a webhook retry,
      // or Stripe redelivering), don't create them twice.
      const existing = await sql`SELECT id FROM orders WHERE stripe_payment_intent_id = ${paymentIntentId} LIMIT 1`;
      if (existing.length === 0) {
        const pendingRows = await sql`SELECT * FROM pending_checkouts WHERE payment_intent_id = ${paymentIntentId}`;
        const pending = pendingRows[0];
        if (pending) {
          await fulfillCheckout(sql, pending);
          await sql`DELETE FROM pending_checkouts WHERE payment_intent_id = ${paymentIntentId}`;
        } else {
          console.error('No pending checkout found for succeeded PaymentIntent', paymentIntentId);
        }
      }
    }
  }

  return res.status(200).json({ received: true });
}
