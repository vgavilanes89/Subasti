import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';

const LIMIT = 8;

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
  // Most recent view per item, newest first — a user re-viewing the same
  // item shouldn't push older, different items further down the list.
  const rows = await sql`
    SELECT item_id, MAX(created_at) AS last_viewed_at
    FROM item_view_events
    WHERE user_id = ${userId}
    GROUP BY item_id
    ORDER BY last_viewed_at DESC
    LIMIT ${LIMIT}
  `;
  return res.status(200).json(rows.map((r) => ({
    itemId: r.item_id,
    lastViewedAt: new Date(r.last_viewed_at).getTime(),
  })));
}
