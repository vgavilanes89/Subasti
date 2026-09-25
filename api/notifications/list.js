import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';

const LIMIT = 50;

function toPublicNotification(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    read: !!row.read_at,
    createdAt: new Date(row.created_at).getTime(),
  };
}

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
  const rows = await sql`
    SELECT * FROM notifications WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT ${LIMIT}
  `;
  return res.status(200).json(rows.map(toPublicNotification));
}
