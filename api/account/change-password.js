import bcrypt from 'bcryptjs';
import { getSql } from '../_lib/db.js';
import { getActiveUserId } from '../_lib/session.js';
import { createRateLimiter, getClientIp } from '../_lib/rateLimit.js';
import { createNotification, getUserContact } from '../_lib/notify.js';
import { checkPassword } from '../../src/lib/passwordPolicy.js';

// Self-service password change for a logged-in user. Asks for the CURRENT
// password so a borrowed or left-open session can't quietly take over the
// account, enforces the shared password policy, and tells the owner by email
// and notification that it happened.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const isRateLimited = createRateLimiter(RATE_LIMIT, RATE_WINDOW_MS);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await getActiveUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Counts every attempt, right or wrong, so the current password can't be
  // guessed through this form.
  if (isRateLimited(`${userId}:${getClientIp(req)}`)) {
    res.setHeader('Retry-After', String(RATE_WINDOW_MS / 1000));
    return res.status(429).json({ error: 'TOO_MANY_ATTEMPTS' });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
  if (!currentPassword) return res.status(400).json({ error: 'WRONG_PASSWORD' });

  try {
    const sql = getSql();
    const rows = await sql`SELECT * FROM users WHERE id = ${userId}`;
    const row = rows[0];
    if (!row || row.is_suspended) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!(await bcrypt.compare(currentPassword, row.password_hash))) {
      return res.status(400).json({ error: 'WRONG_PASSWORD' });
    }

    const check = checkPassword(newPassword, {
      email: row.email, profileName: row.profile_name, realName: row.real_name, cedula: row.cedula,
    });
    if (!check.ok) {
      return res.status(400).json({ error: 'WEAK_PASSWORD', problems: check.problems });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ error: 'SAME_PASSWORD' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    // Conditioned on the old hash so two simultaneous changes can't both win.
    const updated = await sql`
      UPDATE users SET password_hash = ${passwordHash}
      WHERE id = ${row.id} AND password_hash = ${row.password_hash}
      RETURNING id
    `;
    if (!updated[0]) {
      return res.status(409).json({ error: 'TRY_AGAIN' });
    }

    const owner = await getUserContact(sql, String(row.id));
    if (owner) {
      await createNotification({
        sql,
        userId: String(row.id),
        type: 'order_status',
        title: 'Tu contraseña fue cambiada',
        body: 'Si no fuiste tú, restablece tu contraseña de inmediato y contacta a Subasti.',
        link: '/profile',
        email: owner.email,
        name: owner.name,
      }).catch((err) => console.error('Password change notification failed:', err.message));
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Change password failed:', err.message);
    return res.status(500).json({ error: 'REQUEST_FAILED' });
  }
}
