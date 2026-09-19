import { getSql } from '../_lib/db.js';
import { toPublicItem } from '../_lib/items.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = getSql();
  const rows = await sql`SELECT * FROM items ORDER BY created_at DESC`;
  return res.status(200).json(rows.map(toPublicItem));
}
