import bcrypt from 'bcryptjs';
import { getSql } from '../_lib/db.js';
import { getRequestingAdmin } from '../_lib/admin.js';
import { parseSignupInput, validateSignupInput, toPublicUser, generateAccountNumber } from '../_lib/users.js';

const UNIQUE_VIOLATION = '23505';
const MAX_ACCOUNT_NUMBER_ATTEMPTS = 5;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await getRequestingAdmin(req);
  if (!admin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const fields = parseSignupInput(body);
  const validationError = validateSignupInput(fields);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }
  const isAdmin = Boolean(body.isAdmin);

  const sql = getSql();
  const passwordHash = await bcrypt.hash(fields.password, 10);

  let attempt = 0;
  while (attempt < MAX_ACCOUNT_NUMBER_ATTEMPTS) {
    attempt += 1;
    const accountNumber = generateAccountNumber();
    try {
      const rows = await sql`
        INSERT INTO users (account_number, cedula, real_name, profile_name, email, password_hash, country_code, phone, province, city, is_admin)
        VALUES (${accountNumber}, ${fields.cedula}, ${fields.realName}, ${fields.profileName}, ${fields.email}, ${passwordHash}, ${fields.countryCode}, ${fields.phone}, ${fields.province}, ${fields.city}, ${isAdmin})
        RETURNING *
      `;
      return res.status(201).json(toPublicUser(rows[0]));
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
}
