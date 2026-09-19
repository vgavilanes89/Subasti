import { getSql } from '../_lib/db.js';
import { getRequestingAdmin } from '../_lib/admin.js';
import { toPublicOrder } from '../_lib/orders.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await getRequestingAdmin(req);
  if (!admin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const sql = getSql();
  const [orderRows, userRows] = await Promise.all([
    sql`SELECT * FROM orders ORDER BY purchased_at DESC`,
    sql`SELECT id, profile_name FROM users`,
  ]);
  const nameById = new Map(userRows.map((u) => [String(u.id), u.profile_name]));

  const orders = orderRows.map((row) => {
    const order = toPublicOrder(row);
    return {
      ...order,
      buyerName: nameById.get(order.buyerId) || order.buyerId,
      sellerName: nameById.get(order.sellerId) || order.sellerId,
    };
  });
  return res.status(200).json(orders);
}
