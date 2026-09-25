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
  const sql = getSql();

  if (body.all) {
    await sql`UPDATE notifications SET read_at = now() WHERE user_id = ${userId} AND read_at IS NULL`;
    return res.status(200).json({ ok: true });
  }

  const id = typeof body.id === 'string' ? body.id : '';
  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }
  await sql`UPDATE notifications SET read_at = now() WHERE id = ${id} AND user_id = ${userId}`;
  return res.status(200).json({ ok: true });
}
