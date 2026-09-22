import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';
import { toPublicUser, PROFILE_NAME_REGEX } from '../_lib/users.js';

const UNIQUE_VIOLATION = '23505';

// Self-service — limited to the same fields the account tab's edit form
// exposes (profile name, phone). Email/cédula/real name/location changes
// aren't offered there today, so this endpoint doesn't accept them either;
// widening it later means updating both sides together.
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
  const profileName = typeof body.profileName === 'string' ? body.profileName.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';

  if (!PROFILE_NAME_REGEX.test(profileName)) {
    return res.status(400).json({ error: 'Invalid profile name' });
  }
  if (!phone || phone.length > 30) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  try {
    const sql = getSql();
    const rows = await sql`
      UPDATE users SET profile_name = ${profileName}, phone = ${phone}
      WHERE id = ${userId}
      RETURNING *
    `;
    if (!rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json(toPublicUser(rows[0]));
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) {
      return res.status(409).json({ error: 'Profile name is already taken' });
    }
    return res.status(500).json({ error: 'Could not update profile' });
  }
}
