import { del } from '@vercel/blob';
import { getSql } from '../_lib/db.js';
import { getRequestingAdmin } from '../_lib/admin.js';
import { toPublicUser } from '../_lib/users.js';

// Moderation: lets an admin take down a user's profile picture.
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
  const targetId = String(body.userId || '');
  if (!targetId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const sql = getSql();
  const before = await sql`SELECT avatar_url FROM users WHERE id = ${targetId}`;
  const rows = await sql`UPDATE users SET avatar_url = NULL WHERE id = ${targetId} RETURNING *`;
  if (!rows[0]) {
    return res.status(404).json({ error: 'User not found' });
  }
  const oldUrl = before[0]?.avatar_url;
  if (typeof oldUrl === 'string' && oldUrl.includes('.blob.vercel-storage.com')) {
    try {
      await del(oldUrl);
    } catch (err) {
      console.error('Failed to delete avatar blob:', err.message);
    }
  }
  return res.status(200).json(toPublicUser(rows[0]));
}
