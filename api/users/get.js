import { getSql } from '../_lib/db.js';
import { toPublicProfile } from '../_lib/users.js';

// Public seller lookup — item pages and seller profile pages need to show
// a seller's name/location to any visitor, not just users already present
// in the requester's own session-local user map.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }

  const sql = getSql();
  const rows = await sql`SELECT * FROM users WHERE id = ${id}`;
  if (!rows[0]) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.status(200).json(toPublicProfile(rows[0]));
}
