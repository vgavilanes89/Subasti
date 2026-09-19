import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';

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
  const itemId = typeof body.itemId === 'string' ? body.itemId : '';
  if (!itemId) {
    return res.status(400).json({ error: 'itemId is required' });
  }

  const sql = getSql();
  const existing = await sql`SELECT 1 FROM favorites WHERE user_id = ${userId} AND item_id = ${itemId}`;
  if (existing[0]) {
    await sql`DELETE FROM favorites WHERE user_id = ${userId} AND item_id = ${itemId}`;
    return res.status(200).json({ itemId, favorited: false });
  }
  await sql`INSERT INTO favorites (user_id, item_id) VALUES (${userId}, ${itemId}) ON CONFLICT DO NOTHING`;
  return res.status(200).json({ itemId, favorited: true });
}
