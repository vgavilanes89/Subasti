import { getSql } from '../_lib/db.js';
import { getActiveUserId } from '../_lib/session.js';
import { getStripe } from '../_lib/stripe.js';
import {
  MAX_SINPE_NUMBERS, parseSinpePhone, toPublicSinpe, generateSinpeId,
  getStripeCustomerId, toPublicCard, userOwnsPaymentMethod,
} from '../_lib/wallet.js';

// A buyer's saved payment methods:
//   - cards: kept ONLY at Stripe (we store just the Stripe customer id); the
//     list is read back from Stripe, never from our database.
//   - SINPE Móvil: the buyer's own phone number, in saved_sinpe_numbers.
// The "default" is stored on the user as 'card:<pm_id>' or 'sinpe:<id>'.
async function buildSummary(sql, userId) {
  const sinpeRows = await sql`SELECT * FROM saved_sinpe_numbers WHERE user_id = ${userId} ORDER BY created_at DESC`;
  const sinpe = sinpeRows.map(toPublicSinpe);

  let cards = [];
  let cardsAvailable = true;
  const customerId = await getStripeCustomerId(sql, userId);
  if (customerId) {
    try {
      const list = await getStripe().paymentMethods.list({ customer: customerId, type: 'card', limit: 20 });
      cards = list.data.map(toPublicCard);
    } catch (err) {
      console.error('Listing saved cards failed:', err.message);
      cardsAvailable = false;
    }
  }

  const stored = (await sql`SELECT default_payment FROM users WHERE id = ${userId}`)[0]?.default_payment || null;
  const valid = new Set([...cards.map((c) => `card:${c.id}`), ...sinpe.map((s) => `sinpe:${s.id}`)]);
  // A stored default that no longer exists (card removed elsewhere) is ignored;
  // with no usable default, the first saved card (else number) is the default.
  const defaultPayment = stored && valid.has(stored)
    ? stored
    : (cards[0] ? `card:${cards[0].id}` : (sinpe[0] ? `sinpe:${sinpe[0].id}` : null));

  return { cards, sinpe, defaultPayment, cardsAvailable };
}

const setDefault = (sql, userId, value) => sql`UPDATE users SET default_payment = ${value} WHERE id = ${userId}`;

export default async function handler(req, res) {
  const userId = await getActiveUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const sql = getSql();
  const body = typeof req.body === 'object' && req.body ? req.body : {};

  try {
    if (req.method === 'GET') {
      return res.status(200).json(await buildSummary(sql, userId));
    }

    // Add a SINPE Móvil number (cards are added through Stripe: see setup-intent.js).
    if (req.method === 'POST') {
      const phone = parseSinpePhone(body.phone);
      if (!phone) return res.status(400).json({ error: 'INVALID_SINPE_PHONE' });
      const alias = typeof body.alias === 'string' ? body.alias.trim().slice(0, 40) : '';

      const existing = await sql`SELECT id FROM saved_sinpe_numbers WHERE user_id = ${userId} AND phone = ${phone}`;
      let id = existing[0]?.id;
      if (!id) {
        const count = await sql`SELECT COUNT(*)::int AS n FROM saved_sinpe_numbers WHERE user_id = ${userId}`;
        if (count[0].n >= MAX_SINPE_NUMBERS) return res.status(409).json({ error: 'TOO_MANY_NUMBERS' });
        id = generateSinpeId();
        await sql`INSERT INTO saved_sinpe_numbers (id, user_id, alias, phone) VALUES (${id}, ${userId}, ${alias || null}, ${phone})`;
      }
      if (body.makeDefault === true) await setDefault(sql, userId, `sinpe:${id}`);
      return res.status(201).json({ ...(await buildSummary(sql, userId)), id });
    }

    if (req.method === 'PATCH') {
      const type = body.type === 'sinpe' ? 'sinpe' : body.type === 'card' ? 'card' : null;
      const id = typeof body.id === 'string' ? body.id : '';
      if (!type || !id) return res.status(400).json({ error: 'INVALID_REQUEST' });
      if (type === 'sinpe') {
        const ok = await sql`SELECT 1 FROM saved_sinpe_numbers WHERE id = ${id} AND user_id = ${userId}`;
        if (!ok[0]) return res.status(404).json({ error: 'NOT_FOUND' });
      } else if (!(await userOwnsPaymentMethod(sql, userId, id))) {
        return res.status(404).json({ error: 'NOT_FOUND' });
      }
      await setDefault(sql, userId, `${type}:${id}`);
      return res.status(200).json(await buildSummary(sql, userId));
    }

    if (req.method === 'DELETE') {
      const type = req.query.type === 'sinpe' ? 'sinpe' : req.query.type === 'card' ? 'card' : null;
      const id = typeof req.query.id === 'string' ? req.query.id : '';
      if (!type || !id) return res.status(400).json({ error: 'INVALID_REQUEST' });

      if (type === 'sinpe') {
        const removed = await sql`DELETE FROM saved_sinpe_numbers WHERE id = ${id} AND user_id = ${userId} RETURNING id`;
        if (!removed[0]) return res.status(404).json({ error: 'NOT_FOUND' });
      } else {
        if (!(await userOwnsPaymentMethod(sql, userId, id))) return res.status(404).json({ error: 'NOT_FOUND' });
        await getStripe().paymentMethods.detach(id);
      }
      await sql`UPDATE users SET default_payment = NULL WHERE id = ${userId} AND default_payment = ${`${type}:${id}`}`;
      return res.status(200).json(await buildSummary(sql, userId));
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Saved payment methods error:', err.message);
    return res.status(500).json({ error: 'REQUEST_FAILED' });
  }
}
