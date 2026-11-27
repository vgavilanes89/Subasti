import { getSql } from '../_lib/db.js';
import { toPublicItem, reserveViewer } from '../_lib/items.js';
import { getUserIdFromRequest } from '../_lib/session.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = getSql();
  const rows = await sql`SELECT * FROM items ORDER BY created_at DESC`;
  const canSee = await reserveViewer(sql, getUserIdFromRequest(req));
  return res.status(200).json(rows.map((row) => toPublicItem(row, { includeReserve: canSee(row) })));
}
