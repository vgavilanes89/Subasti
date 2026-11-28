import bcrypt from 'bcryptjs';
import { getSql } from '../_lib/db.js';
import { createRateLimiter, getClientIp } from '../_lib/rateLimit.js';
import { verifyResetToken, fingerprintMatches } from '../_lib/passwordReset.js';
import { createNotification, getUserContact } from '../_lib/notify.js';
import { checkPassword } from '../../src/lib/passwordPolicy.js';

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 1000;
const isRateLimited = createRateLimiter(RATE_LIMIT, RATE_WINDOW_MS);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (isRateLimited(getClientIp(req))) {
    res.setHeader('Retry-After', String(RATE_WINDOW_MS / 1000));
    return res.status(429).json({ error: 'Too many attempts, please try again shortly' });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const token = typeof body.token === 'string' ? body.token : '';
  const password = typeof body.password === 'string' ? body.password : '';

  // Same policy as signup (src/lib/passwordPolicy.js). Checked first without the
  // account's details (cheap), and again below with them.
  const basicCheck = checkPassword(password);
  if (!basicCheck.ok) {
    return res.status(400).json({ error: 'WEAK_PASSWORD', problems: basicCheck.problems });
  }

  const verified = verifyResetToken(token);
  if (!verified) {
    return res.status(400).json({ error: 'INVALID_OR_EXPIRED_LINK' });
  }

  try {
    const sql = getSql();
    const rows = await sql`SELECT * FROM users WHERE id = ${verified.userId}`;
    const row = rows[0];
    // The fingerprint check is what makes a link single-use: once the
    // password has changed, the hash no longer matches.
    if (!row || row.is_suspended || !fingerprintMatches(row, verified.fingerprint)) {
      return res.status(400).json({ error: 'INVALID_OR_EXPIRED_LINK' });
    }

    const personalCheck = checkPassword(password, {
      email: row.email, profileName: row.profile_name, realName: row.real_name, cedula: row.cedula,
    });
    if (!personalCheck.ok) {
      return res.status(400).json({ error: 'WEAK_PASSWORD', problems: personalCheck.problems });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // Conditioned on the old hash so two simultaneous uses of the same link
    // can't both succeed.
    const updated = await sql`
      UPDATE users SET password_hash = ${passwordHash}
      WHERE id = ${row.id} AND password_hash = ${row.password_hash}
      RETURNING id
    `;
    if (!updated[0]) {
      return res.status(400).json({ error: 'INVALID_OR_EXPIRED_LINK' });
    }

    // The link went to their inbox, so this confirms the address too.
    await sql`UPDATE users SET email_verified_at = COALESCE(email_verified_at, now()) WHERE id = ${row.id}`
      .catch((err) => console.error('Could not mark email confirmed:', err.message));

    const owner = await getUserContact(sql, String(row.id));
    if (owner) {
      await createNotification({
        sql,
        userId: String(row.id),
        type: 'order_status',
        title: 'Tu contraseña fue cambiada',
        body: 'Si no fuiste tú, contacta a Subasti de inmediato.',
        link: '/profile',
        email: owner.email,
        name: owner.name,
      }).catch((err) => console.error('Password change notification failed:', err.message));
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Reset password failed:', err.message);
    return res.status(500).json({ error: 'REQUEST_FAILED' });
  }
}
