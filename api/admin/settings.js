import { getSql } from '../_lib/db.js';
import { getRequestingAdmin } from '../_lib/admin.js';
import { getCommissionRate, setCommissionRate } from '../_lib/settings.js';

export default async function handler(req, res) {
  const admin = await getRequestingAdmin(req);
  if (!admin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const sql = getSql();

  if (req.method === 'GET') {
    const commissionRate = await getCommissionRate(sql);
    return res.status(200).json({ commissionRate });
  }

  if (req.method === 'POST') {
    const body = typeof req.body === 'object' && req.body ? req.body : {};
    const rate = Number(body.commissionRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      return res.status(400).json({ error: 'commissionRate must be a number between 0 and 100' });
    }
    await setCommissionRate(sql, rate);
    return res.status(200).json({ commissionRate: rate });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
