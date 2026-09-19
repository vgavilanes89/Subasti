import { randomUUID } from 'crypto';
import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const itemId = typeof body.itemId === 'string' ? body.itemId : '';
  if (!itemId) {
    return res.status(400).json({ error: 'itemId is required' });
  }

  const userId = getUserIdFromRequest(req);
  const sql = getSql();
  await sql`
    INSERT INTO item_view_events (id, item_id, user_id)
    VALUES (${`view_${randomUUID()}`}, ${itemId}, ${userId})
  `;
  return res.status(204).end();
}
