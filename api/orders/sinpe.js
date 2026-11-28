import { getSql } from '../_lib/db.js';
import { getActiveUserId } from '../_lib/session.js';
import { getOrderById, generatePaymentReference } from '../_lib/orders.js';
import { getItemById, isSuspendedUser } from '../_lib/items.js';
import { getSinpeNumber } from '../_lib/settings.js';
import { parseSinpePhone } from '../_lib/wallet.js';
import { createNotification, formatMoney } from '../_lib/notify.js';
import { itemAcceptsMethod } from '../../src/data/paymentMethods.js';
import { ORDER_STATUS } from '../../src/data/escrow.js';

// The buyer's side of paying by SINPE Móvil. Nothing here ever marks an order
// as paid — that only happens when an admin confirms the money arrived
// (api/admin/sinpe-payments.js).
//
//   action 'prepare': the instructions — Subasti's SINPE number, the payment
//                     reference to use as the transfer description, the total.
//   action 'report' : "I've made the transfer" — flags it for an admin to check.
//
// Works on a whole checkout (by `reference`) or a single order (by `orderId`,
// e.g. an auction win that hasn't been paid yet).
const summarize = (orders, number) => {
  const totals = {};
  for (const o of orders) {
    totals[o.currency] = (totals[o.currency] || 0) + Number(o.amount) + Number(o.shipping_cost);
  }
  return {
    reference: orders[0].payment_reference,
    number,
    totals,
    reported: orders.every((o) => o.payment_reported_at),
    orderIds: orders.map((o) => o.id),
  };
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await getActiveUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const action = body.action === 'report' ? 'report' : 'prepare';
  const reference = typeof body.reference === 'string' ? body.reference.trim() : '';
  const orderId = typeof body.orderId === 'string' ? body.orderId : '';

  try {
    const sql = getSql();
    const number = await getSinpeNumber(sql);
    if (!number) return res.status(503).json({ error: 'SINPE_UNAVAILABLE' });

    let rows;
    if (reference) {
      rows = await sql`SELECT * FROM orders WHERE payment_reference = ${reference} AND buyer_id = ${userId}`;
    } else {
      const order = await getOrderById(sql, orderId);
      rows = order && order.buyer_id === userId ? [order] : [];
    }
    if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    let orders = rows.filter((o) => o.status === ORDER_STATUS.PENDING_PAYMENT);
    if (orders.length === 0) return res.status(409).json({ error: 'NOT_PAYABLE' });

    // No payment instructions for a suspended seller. Reporting a transfer already
    // made stays open, so an admin can still check it and refund.
    if (action === 'prepare') {
      for (const o of orders) {
        if (await isSuspendedUser(sql, o.seller_id)) return res.status(409).json({ error: 'SELLER_UNAVAILABLE' });
      }
    }

    // Only a way the seller accepts. (A deleted item can't be checked, so it
    // doesn't strand the order.)
    for (const o of orders) {
      const item = await getItemById(sql, o.item_id);
      if (item && !itemAcceptsMethod(item, 'sinpe')) {
        return res.status(409).json({ error: 'PAYMENT_METHOD_NOT_ACCEPTED' });
      }
    }

    // An order that wasn't created through SINPE checkout (an auction win) gets
    // its reference the first time its buyer asks how to pay.
    if (orders.some((o) => !o.payment_reference)) {
      const newReference = generatePaymentReference();
      await sql`
        UPDATE orders SET payment_reference = ${newReference}, payment_method = 'sinpe'
        WHERE id = ANY(${orders.filter((o) => !o.payment_reference).map((o) => o.id)}) AND buyer_id = ${userId}
          AND status = ${ORDER_STATUS.PENDING_PAYMENT}
      `;
      orders = await sql`
        SELECT * FROM orders WHERE id = ANY(${orders.map((o) => o.id)}) AND buyer_id = ${userId}
      `;
    }

    if (action === 'prepare') {
      return res.status(200).json(summarize(orders, number));
    }

    // ---- report ----
    const phone = parseSinpePhone(body.sinpePhone);
    if (!phone) return res.status(400).json({ error: 'SINPE_PHONE_REQUIRED' });

    const firstReport = orders.some((o) => !o.payment_reported_at);
    orders = await sql`
      UPDATE orders SET
        payment_reported_at = COALESCE(payment_reported_at, now()),
        payment_method = 'sinpe',
        sinpe_phone = ${phone}
      WHERE id = ANY(${orders.map((o) => o.id)}) AND buyer_id = ${userId}
        AND status = ${ORDER_STATUS.PENDING_PAYMENT}
      RETURNING *
    `;

    // Tell the admins there is a transfer to check (only on the first report, so
    // pressing the button twice doesn't ping everyone twice).
    if (firstReport && orders.length > 0) {
      try {
        const summary = summarize(orders, number);
        const total = Object.entries(summary.totals).map(([cur, amt]) => formatMoney(amt, cur)).join(' + ');
        const buyer = (await sql`SELECT profile_name FROM users WHERE id = ${userId}`)[0];
        const admins = await sql`SELECT id, email, real_name, profile_name FROM users WHERE is_admin = TRUE`;
        await Promise.all(admins.map((a) => createNotification({
          sql,
          userId: String(a.id),
          type: 'order_status',
          title: `Pago SINPE por verificar: ${summary.reference}`,
          body: `${buyer?.profile_name || 'Un comprador'} reportó una transferencia de ${total} (referencia ${summary.reference}). Confírmala en Admin → Pagos SINPE.`,
          link: '/admin?tab=sinpe',
          email: a.email,
          name: a.real_name || a.profile_name,
        }).catch((err) => console.error('Admin SINPE notification failed:', err.message))));
      } catch (err) {
        console.error('Admin SINPE notification failed:', err.message);
      }
    }

    return res.status(200).json(summarize(orders, number));
  } catch (err) {
    console.error('SINPE order step failed:', err.message);
    return res.status(500).json({ error: 'REQUEST_FAILED' });
  }
}
