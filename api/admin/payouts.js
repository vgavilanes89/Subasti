import { getSql } from '../_lib/db.js';
import { getRequestingAdmin } from '../_lib/admin.js';

// A seller's outstanding balance = revenue from their completed orders minus
// whatever has already been recorded as paid out to them. This is a ledger,
// not a real payout mechanism — see sql/009_claims_and_payouts.sql.
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
  const [earnedRows, paidRows, history, userRows] = await Promise.all([
    sql`
      SELECT seller_id, currency, SUM(amount + shipping_cost) AS total
      FROM orders WHERE status = 'completed' GROUP BY seller_id, currency
    `,
    sql`SELECT seller_id, currency, SUM(amount) AS total FROM payouts GROUP BY seller_id, currency`,
    sql`SELECT * FROM payouts ORDER BY paid_out_at DESC LIMIT 50`,
    sql`SELECT id, profile_name FROM users`,
  ]);
  const nameById = new Map(userRows.map((u) => [String(u.id), u.profile_name]));

  const key = (sellerId, currency) => `${sellerId}::${currency}`;
  const paidByKey = new Map(paidRows.map((r) => [key(r.seller_id, r.currency), Number(r.total)]));

  const balances = earnedRows.map((r) => {
    const earned = Number(r.total);
    const paid = paidByKey.get(key(r.seller_id, r.currency)) || 0;
    return {
      sellerId: r.seller_id,
      sellerName: nameById.get(r.seller_id) || r.seller_id,
      currency: r.currency,
      earned,
      paidOut: paid,
      outstanding: earned - paid,
    };
  }).filter((b) => b.outstanding > 0.005);

  return res.status(200).json({
    balances,
    history: history.map((r) => ({
      id: r.id,
      sellerId: r.seller_id,
      sellerName: nameById.get(r.seller_id) || r.seller_id,
      amount: Number(r.amount),
      currency: r.currency,
      note: r.note,
      paidOutBy: r.paid_out_by,
      paidOutAt: r.paid_out_at ? new Date(r.paid_out_at).getTime() : null,
    })),
  });
}
