import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';
import { toPublicOrder } from '../_lib/orders.js';

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
  const role = req.query.role === 'seller' ? 'seller' : 'buyer';
  const rows = role === 'seller'
    ? await sql`SELECT * FROM orders WHERE seller_id = ${userId} ORDER BY purchased_at DESC`
    : await sql`SELECT * FROM orders WHERE buyer_id = ${userId} ORDER BY purchased_at DESC`;
  return res.status(200).json(rows.map(toPublicOrder));
}
