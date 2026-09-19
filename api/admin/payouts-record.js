import { randomUUID } from 'crypto';
import { getSql } from '../_lib/db.js';
import { getRequestingAdmin } from '../_lib/admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await getRequestingAdmin(req);
  if (!admin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const sellerId = typeof body.sellerId === 'string' ? body.sellerId : '';
  const currency = typeof body.currency === 'string' ? body.currency : '';
  const amount = Number(body.amount);
  const note = typeof body.note === 'string' ? body.note.trim() || null : null;

  if (!sellerId || !currency || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'sellerId, currency and a positive amount are required' });
  }

  const sql = getSql();
  const id = `payout_${randomUUID()}`;
  const rows = await sql`
    INSERT INTO payouts (id, seller_id, amount, currency, note, paid_out_by)
    VALUES (${id}, ${sellerId}, ${amount}, ${currency}, ${note}, ${String(admin.id)})
    RETURNING *
  `;
  const row = rows[0];
  return res.status(201).json({
    id: row.id,
    sellerId: row.seller_id,
    amount: Number(row.amount),
    currency: row.currency,
    note: row.note,
    paidOutBy: row.paid_out_by,
    paidOutAt: new Date(row.paid_out_at).getTime(),
  });
}
