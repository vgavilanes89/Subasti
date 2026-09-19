import { getSql } from '../_lib/db.js';
import { getRequestingAdmin } from '../_lib/admin.js';
import { parseSignupInput, validateProfileFields, toPublicUser } from '../_lib/users.js';

const UNIQUE_VIOLATION = '23505';

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
  const targetId = typeof body.userId === 'string' ? body.userId : '';
  if (!targetId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const fields = parseSignupInput(body);
  const validationError = validateProfileFields(fields);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const sql = getSql();
    const rows = await sql`
      UPDATE users SET
        cedula = ${fields.cedula},
        real_name = ${fields.realName},
        profile_name = ${fields.profileName},
        email = ${fields.email},
        country_code = ${fields.countryCode},
        phone = ${fields.phone},
        province = ${fields.province},
        city = ${fields.city}
      WHERE id = ${targetId}
      RETURNING *
    `;
    if (!rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json(toPublicUser(rows[0]));
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) {
      const constraint = err.constraint || '';
      if (constraint.includes('email')) return res.status(409).json({ error: 'Email is already registered' });
      if (constraint.includes('cedula')) return res.status(409).json({ error: 'Cédula is already registered' });
      if (constraint.includes('profile_name')) return res.status(409).json({ error: 'Profile name is already taken' });
      return res.status(409).json({ error: 'Conflict' });
    }
    return res.status(500).json({ error: 'Could not update user' });
  }
}
