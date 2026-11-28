import { getSql } from '../_lib/db.js';
import { getActiveUserId } from '../_lib/session.js';
import { getSinpeNumber } from '../_lib/settings.js';

// Lets checkout know whether SINPE Móvil can be offered. It is only available
// once an admin has set Subasti's receiving number. (The number itself is
// returned with a specific payment's instructions, not here.)
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!await getActiveUserId(req)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    return res.status(200).json({ available: Boolean(await getSinpeNumber(getSql())) });
  } catch {
    return res.status(200).json({ available: false });
  }
}
