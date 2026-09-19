import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const sql = getSql();
  const rows = await sql`SELECT item_id FROM favorites WHERE user_id = ${userId}`;
  return res.status(200).json(rows.map((r) => r.item_id));
}
