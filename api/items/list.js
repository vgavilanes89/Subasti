import { getSql } from '../_lib/db.js';
import { toPublicItem, reserveViewer, suspendedUserIds } from '../_lib/items.js';
import { getActiveUserId } from '../_lib/session.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = getSql();
  const rows = await sql`SELECT * FROM items ORDER BY created_at DESC`;
  const canSee = await reserveViewer(sql, await getActiveUserId(req));
  // Filtered here, not in SQL, so this works before sql/025 adds the column.
  // Admins still see a suspended seller's listings, to review or delete them.
  const hidden = canSee.isAdmin ? new Set() : await suspendedUserIds(sql);
  return res.status(200).json(rows.filter((row) => !row.removed_at && !hidden.has(row.seller_id)).map((row) => toPublicItem(row, { includeReserve: canSee(row) })));
}
