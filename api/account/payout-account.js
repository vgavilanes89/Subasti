import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';
import { parsePayoutAccount, toPublicPayoutAccount } from '../_lib/payoutAccount.js';
import { createNotification, getUserContact } from '../_lib/notify.js';

// A seller's own payout destination. Only ever readable/writable by the
// owner here (admins read it through /api/admin/payouts when paying out).
async function handle(req, res) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const sql = getSql();

  if (req.method === 'GET') {
    const rows = await sql`SELECT * FROM seller_payout_accounts WHERE user_id = ${userId}`;
    return res.status(200).json(toPublicPayoutAccount(rows[0]));
  }

  if (req.method === 'POST') {
    const body = typeof req.body === 'object' && req.body ? req.body : {};
    const parsed = parsePayoutAccount(body);
    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }
    const a = parsed.value;

    const rows = await sql`
      INSERT INTO seller_payout_accounts (user_id, method, holder_name, bank_name, iban, sinpe_phone, updated_at)
      VALUES (${userId}, ${a.method}, ${a.holderName}, ${a.bankName}, ${a.iban}, ${a.sinpePhone}, now())
      ON CONFLICT (user_id) DO UPDATE SET
        method = EXCLUDED.method, holder_name = EXCLUDED.holder_name, bank_name = EXCLUDED.bank_name,
        iban = EXCLUDED.iban, sinpe_phone = EXCLUDED.sinpe_phone, updated_at = now()
      RETURNING *
    `;

    // Redirecting someone's payouts is the obvious thing to abuse if an
    // account is taken over, so always tell the owner by email as well.
    const owner = await getUserContact(sql, userId);
    if (owner) {
      await createNotification({
        sql,
        userId,
        type: 'order_status',
        title: 'Actualizaste tu cuenta para recibir pagos',
        body: 'Si no fuiste tú, cambia tu contraseña y contacta a Subasti de inmediato.',
        link: '/profile?tab=selling',
        email: owner.email,
        name: owner.name,
      }).catch((err) => console.error('Payout account notification failed:', err.message));
    }

    return res.status(200).json(toPublicPayoutAccount(rows[0]));
  }

  if (req.method === 'DELETE') {
    await sql`DELETE FROM seller_payout_accounts WHERE user_id = ${userId}`;
    return res.status(200).json(null);
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}

export default async function handler(req, res) {
  try {
    return await handle(req, res);
  } catch (err) {
    console.error('Payout account request failed:', err.message);
    return res.status(500).json({ error: 'REQUEST_FAILED' });
  }
}
