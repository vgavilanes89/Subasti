import { getSql } from '../_lib/db.js';
import { getRequestingAdmin } from '../_lib/admin.js';
import { getSinpeNumber, setSinpeNumber } from '../_lib/settings.js';
import { parseSinpePhone } from '../_lib/wallet.js';
import { toPublicOrder } from '../_lib/orders.js';
import { createNotification, getUserContact, notifySellerOfSale, formatMoney } from '../_lib/notify.js';
import { ESCROW_WINDOW_MS, ORDER_STATUS } from '../../src/data/escrow.js';

// Admin verification of SINPE Móvil payments. Buyers transfer to Subasti's own
// number with a payment reference; an admin checks the money really arrived and
// confirms — which is the ONLY thing that moves a SINPE order into escrow and
// tells the seller to ship.
async function listPayments(sql) {
  const rows = await sql`
    SELECT o.*, u.profile_name AS buyer_name, u.email AS buyer_email, u.real_name AS buyer_real_name
    FROM orders o LEFT JOIN users u ON u.id::text = o.buyer_id
    WHERE o.payment_method = 'sinpe' AND o.status = ${ORDER_STATUS.PENDING_PAYMENT}
      AND o.payment_reference IS NOT NULL
    ORDER BY o.payment_reported_at DESC NULLS LAST, o.purchased_at DESC
  `;
  const groups = new Map();
  for (const row of rows) {
    const ref = row.payment_reference;
    if (!groups.has(ref)) {
      groups.set(ref, {
        reference: ref,
        buyerId: row.buyer_id,
        buyerName: row.buyer_name || row.buyer_id,
        buyerRealName: row.buyer_real_name || '',
        buyerEmail: row.buyer_email || '',
        sinpePhone: row.sinpe_phone || '',
        reportedAt: null,
        createdAt: new Date(row.purchased_at).getTime(),
        totals: {},
        orders: [],
      });
    }
    const g = groups.get(ref);
    if (row.payment_reported_at) {
      const t = new Date(row.payment_reported_at).getTime();
      g.reportedAt = Math.max(g.reportedAt || 0, t);
    }
    g.totals[row.currency] = (g.totals[row.currency] || 0) + Number(row.amount) + Number(row.shipping_cost);
    g.orders.push({ id: row.id, itemTitle: row.item_title, amount: Number(row.amount), shippingCost: Number(row.shipping_cost), currency: row.currency, sellerId: row.seller_id });
  }
  // Reported transfers first (those are waiting on an admin), newest first.
  return [...groups.values()].sort((a, b) => (b.reportedAt || 0) - (a.reportedAt || 0) || b.createdAt - a.createdAt);
}

export default async function handler(req, res) {
  const admin = await getRequestingAdmin(req);
  if (!admin) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const sql = getSql();

  try {
    if (req.method === 'GET') {
      return res.status(200).json({ number: await getSinpeNumber(sql), payments: await listPayments(sql) });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = typeof req.body === 'object' && req.body ? req.body : {};
    const action = body.action;

    if (action === 'setNumber') {
      const digits = parseSinpePhone(body.number);
      if (!digits) return res.status(400).json({ error: 'INVALID_SINPE_PHONE' });
      await setSinpeNumber(sql, digits);
      return res.status(200).json({ number: digits, payments: await listPayments(sql) });
    }

    const reference = typeof body.reference === 'string' ? body.reference.trim() : '';
    if (!reference || (action !== 'confirm' && action !== 'reject')) {
      return res.status(400).json({ error: 'INVALID_REQUEST' });
    }

    if (action === 'confirm') {
      // Guarded on status so confirming twice (two admins, a double click) can
      // only ever move each order into escrow once.
      const now = Date.now();
      const confirmed = await sql`
        UPDATE orders SET
          status = ${ORDER_STATUS.ESCROW_HELD},
          payment_due_at = NULL,
          escrow_held_at = to_timestamp(${now} / 1000.0),
          ship_by_at = to_timestamp(${now + ESCROW_WINDOW_MS} / 1000.0),
          payment_verified_at = to_timestamp(${now} / 1000.0),
          payment_verified_by = ${String(admin.id)}
        WHERE payment_reference = ${reference} AND payment_method = 'sinpe' AND status = ${ORDER_STATUS.PENDING_PAYMENT}
        RETURNING *
      `;
      if (confirmed.length === 0) return res.status(409).json({ error: 'NOTHING_TO_CONFIRM' });

      for (const order of confirmed) {
        await notifySellerOfSale({ sql, sellerId: order.seller_id, itemTitle: order.item_title, quantity: order.quantity || 1 });
      }
      const buyerId = confirmed[0].buyer_id;
      const buyer = await getUserContact(sql, buyerId);
      const total = Object.entries(confirmed.reduce((t, o) => ({ ...t, [o.currency]: (t[o.currency] || 0) + Number(o.amount) + Number(o.shipping_cost) }), {}))
        .map(([cur, amt]) => formatMoney(amt, cur)).join(' + ');
      await createNotification({
        sql,
        userId: buyerId,
        type: 'order_status',
        title: `Pago SINPE confirmado (${reference})`,
        body: `Recibimos tu transferencia de ${total}. El dinero queda en depósito y el vendedor ya puede enviar tu pedido.`,
        link: '/profile?tab=buying',
        email: buyer?.email,
        name: buyer?.name,
      }).catch((err) => console.error('SINPE confirm notification failed:', err.message));

      return res.status(200).json({ confirmed: confirmed.map(toPublicOrder), payments: await listPayments(sql) });
    }

    // reject: the money did not arrive (or the amount was wrong). The orders
    // stay unpaid; clearing the report lets the buyer correct it and report again.
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 300) : '';
    const rejected = await sql`
      UPDATE orders SET payment_reported_at = NULL
      WHERE payment_reference = ${reference} AND payment_method = 'sinpe' AND status = ${ORDER_STATUS.PENDING_PAYMENT}
      RETURNING buyer_id
    `;
    if (rejected.length === 0) return res.status(409).json({ error: 'NOTHING_TO_REJECT' });
    const buyerId = rejected[0].buyer_id;
    const buyer = await getUserContact(sql, buyerId);
    await createNotification({
      sql,
      userId: buyerId,
      type: 'order_status',
      title: `No encontramos tu pago SINPE (${reference})`,
      body: `No pudimos confirmar tu transferencia${note ? `: ${note}` : '.'} Revisa el monto y la referencia ${reference}; si ya pagaste, escríbenos desde Contacto.`,
      link: '/profile?tab=buying',
      email: buyer?.email,
      name: buyer?.name,
    }).catch((err) => console.error('SINPE reject notification failed:', err.message));

    return res.status(200).json({ payments: await listPayments(sql) });
  } catch (err) {
    console.error('Admin SINPE payments error:', err.message);
    return res.status(500).json({ error: 'REQUEST_FAILED' });
  }
}
