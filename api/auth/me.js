import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';
import { toPublicUser } from '../_lib/users.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const sql = getSql();
    const rows = await sql`SELECT * FROM users WHERE id = ${userId}`;
    if (!rows[0]) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    return res.status(200).json(toPublicUser(rows[0]));
  } catch {
    return res.status(500).json({ error: 'Could not load session' });
  }
}
