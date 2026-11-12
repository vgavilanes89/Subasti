import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';
import { notifyEndedAuctionLosers } from '../_lib/notify.js';

const LIMIT = 50;

// There is no background worker, and clients poll this endpoint every ~15s,
// so it doubles as the trigger for "an auction you bid on ended and you didn't
// win" notifications. The sweep is idempotent; the throttle just keeps it to
// roughly one cheap query a few times a minute per server instance.
const SWEEP_EVERY_MS = 20000;
let lastSweepAt = 0;

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
  if (Date.now() - lastSweepAt > SWEEP_EVERY_MS) {
    lastSweepAt = Date.now();
    try {
      await notifyEndedAuctionLosers(sql);
    } catch (err) {
      console.error('Ended-auction sweep failed:', err.message);
    }
  }
  const rows = await sql`
    SELECT * FROM notifications WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT ${LIMIT}
  `;
  return res.status(200).json(rows.map(toPublicNotification));
}
