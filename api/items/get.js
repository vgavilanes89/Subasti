import { getSql } from '../_lib/db.js';
import { toPublicItem } from '../_lib/items.js';

// Lightweight single-row fetch for the item page's live poll — pulling the
// full /api/items/list catalog every few seconds would be wasteful.
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
  const rows = await sql`SELECT * FROM items WHERE id = ${id}`;
  if (!rows[0]) {
    return res.status(404).json({ error: 'Item not found' });
  }
  return res.status(200).json(toPublicItem(rows[0]));
}
