import { getSql } from '../_lib/db.js';
import { getRequestingAdmin } from '../_lib/admin.js';
import { toPublicUser } from '../_lib/users.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await getRequestingAdmin(req);
  if (!admin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const sql = getSql();
  const rows = await sql`SELECT * FROM users ORDER BY created_at DESC`;
  return res.status(200).json(rows.map(toPublicUser));
}
