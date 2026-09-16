import bcrypt from 'bcryptjs';
import { getSql } from '../_lib/db.js';
import { createRateLimiter, getClientIp } from '../_lib/rateLimit.js';
import { createSessionToken, setSessionCookie } from '../_lib/session.js';
import { parseSignupInput, validateSignupInput, toPublicUser, generateAccountNumber } from '../_lib/users.js';

const RATE_LIMIT = 10; // requests
const RATE_WINDOW_MS = 60 * 1000;
const isRateLimited = createRateLimiter(RATE_LIMIT, RATE_WINDOW_MS);

const UNIQUE_VIOLATION = '23505';
const MAX_ACCOUNT_NUMBER_ATTEMPTS = 5;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (isRateLimited(getClientIp(req))) {
    res.setHeader('Retry-After', String(RATE_WINDOW_MS / 1000));
    return res.status(429).json({ error: 'Too many requests, please try again shortly' });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const fields = parseSignupInput(body);
  const validationError = validateSignupInput(fields);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const sql = getSql();
    const passwordHash = await bcrypt.hash(fields.password, 10);

    let attempt = 0;
    while (attempt < MAX_ACCOUNT_NUMBER_ATTEMPTS) {
      attempt += 1;
      const accountNumber = generateAccountNumber();
      try {
        const rows = await sql`
          INSERT INTO users (account_number, cedula, real_name, profile_name, email, password_hash, country_code, phone, province, city)
          VALUES (${accountNumber}, ${fields.cedula}, ${fields.realName}, ${fields.profileName}, ${fields.email}, ${passwordHash}, ${fields.countryCode}, ${fields.phone}, ${fields.province}, ${fields.city})
          RETURNING *
        `;
        const user = toPublicUser(rows[0]);
        setSessionCookie(res, createSessionToken(user.id));
        return res.status(201).json(user);
      } catch (err) {
        if (err.code === UNIQUE_VIOLATION) {
          const constraint = err.constraint || '';
          if (constraint.includes('account_number')) {
            continue; // collision on the random account number — retry with a new one
          }
          if (constraint.includes('email')) {
            return res.status(409).json({ error: 'Email is already registered' });
          }
          if (constraint.includes('cedula')) {
            return res.status(409).json({ error: 'Cédula is already registered' });
          }
          if (constraint.includes('profile_name')) {
            return res.status(409).json({ error: 'Profile name is already taken' });
          }
          return res.status(409).json({ error: 'Account already exists' });
        }
        throw err;
      }
    }
    return res.status(500).json({ error: 'Could not generate a unique account number' });
  } catch {
    return res.status(500).json({ error: 'Could not create account' });
  }
}
