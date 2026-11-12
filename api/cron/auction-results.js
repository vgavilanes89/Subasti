import { getSql } from '../_lib/db.js';
import { notifyEndedAuctionLosers } from '../_lib/notify.js';

// Daily backstop for "your auction ended and you didn't win" notifications.
// The notification poll (api/notifications/list.js) normally sends these within
// seconds of an auction ending whenever any user is online; this covers quiet
// periods. Idempotent, so running it as often as you like is harmless.
//
// Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when a CRON_SECRET
// environment variable exists; when it is set, anything else is rejected.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const sent = await notifyEndedAuctionLosers(getSql());
    return res.status(200).json({ sent });
  } catch (err) {
    console.error('Auction results sweep failed:', err.message);
    return res.status(500).json({ error: 'SWEEP_FAILED' });
  }
}
