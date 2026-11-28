import bcrypt from 'bcryptjs';
import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';
import { countHit } from '../_lib/dbRateLimit.js';
import { toPublicUser } from '../_lib/users.js';
import { readEmailToken, sendConfirmationEmail, isUnconfirmed } from '../_lib/emailConfirm.js';

//   POST {token}                              confirm (from the emailed link)
//   POST {action:'resend'}                    send the link again
//   POST {action:'change', email, password}   fix a mistyped address, before confirming
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENDS_PER_HOUR = 5;
const UNIQUE_VIOLATION = '23505';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const body = typeof req.body === 'object' && req.body ? req.body : {};

  try {
    const sql = getSql();

    if (typeof body.token === 'string' && body.token) {
      const link = readEmailToken(body.token);
      const row = link ? (await sql`SELECT id, email FROM users WHERE id = ${link.userId}`)[0] : null;
      if (!row || !link.matches(row.email)) return res.status(400).json({ error: 'INVALID_OR_EXPIRED_LINK' });
      await sql`UPDATE users SET email_verified_at = COALESCE(email_verified_at, now()) WHERE id = ${row.id}`;
      return res.status(200).json({ ok: true });
    }

    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    let row = (await sql`SELECT * FROM users WHERE id = ${userId}`)[0];
    if (!row) return res.status(401).json({ error: 'Not authenticated' });
    if (!isUnconfirmed(row)) return res.status(409).json({ error: 'ALREADY_CONFIRMED' });

    if (body.action !== 'resend' && body.action !== 'change') {
      return res.status(400).json({ error: 'INVALID_REQUEST' });
    }
    // Counted first, so it also limits guessing the password below.
    const hits = await countHit(sql, `emailconfirm:${userId}`, 3600);
    if (hits !== null && hits > SENDS_PER_HOUR) return res.status(429).json({ error: 'TOO_MANY_REQUESTS' });

    if (body.action === 'change') {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      if (!EMAIL_REGEX.test(email) || email.length > 200) return res.status(400).json({ error: 'INVALID_EMAIL' });
      const password = typeof body.password === 'string' ? body.password : '';
      if (!(await bcrypt.compare(password, row.password_hash))) return res.status(400).json({ error: 'WRONG_PASSWORD' });
      try {
        row = (await sql`UPDATE users SET email = ${email} WHERE id = ${userId} RETURNING *`)[0];
      } catch (err) {
        if (err.code === UNIQUE_VIOLATION) return res.status(409).json({ error: 'EMAIL_TAKEN' });
        throw err;
      }
    }

    try {
      await sendConfirmationEmail(row);
    } catch (err) {
      console.error('Confirmation email failed:', err.message);
      return res.status(502).json({ error: 'EMAIL_SEND_FAILED', user: toPublicUser(row) });
    }
    return res.status(200).json({ ok: true, user: toPublicUser(row) });
  } catch (err) {
    console.error('Email confirmation failed:', err.message);
    return res.status(500).json({ error: 'REQUEST_FAILED' });
  }
}
