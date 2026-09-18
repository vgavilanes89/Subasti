import bcrypt from 'bcryptjs';
import { getSql } from '../_lib/db.js';
import { createRateLimiter, getClientIp } from '../_lib/rateLimit.js';
import { createSessionToken, setSessionCookie } from '../_lib/session.js';
import { toPublicUser } from '../_lib/users.js';

// Tighter than signup's limiter — this is the brute-force-guessing surface.
const RATE_LIMIT = 8; // requests
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
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const sql = getSql();
    const rows = await sql`SELECT * FROM users WHERE email = ${email}`;
    const row = rows[0];
    const passwordMatches = row ? await bcrypt.compare(password, row.password_hash) : false;

    if (!row || !passwordMatches) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (row.is_suspended) {
      return res.status(403).json({ error: 'ACCOUNT_SUSPENDED' });
    }

    const user = toPublicUser(row);
    setSessionCookie(res, createSessionToken(user.id));
    return res.status(200).json(user);
  } catch {
    return res.status(500).json({ error: 'Could not log in' });
  }
}
