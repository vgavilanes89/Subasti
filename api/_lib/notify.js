// Thin REST clients for Resend (email) and Twilio (SMS) — plain fetch calls
// rather than their SDKs so there's nothing new for Vercel's bundler to
// mis-trace (see the @vercel/blob/client lesson: a subpath export's chunk
// silently failed to bundle in production even though it worked locally).
// Both no-op (return { skipped: true }) when their env vars aren't set yet,
// so bidding keeps working before/while these are provisioned.

import { randomUUID } from 'crypto';

const RESEND_API_URL = 'https://api.resend.com/emails';

export async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('Outbid email skipped: RESEND_API_KEY not configured');
    return { skipped: true };
  }
  const from = process.env.RESEND_FROM_EMAIL || 'Subasti <onboarding@resend.dev>';
  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
  return res.json();
}

export async function sendSms({ to, body }) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    console.log('Outbid SMS skipped: Twilio env vars not configured');
    return { skipped: true };
  }
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const params = new URLSearchParams({ To: to, From: from, Body: body });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Twilio error ${res.status}: ${body}`);
  }
  return res.json();
}

// Users store country code ('+506') and a locally-formatted phone
// ('8888-8888') separately — Twilio needs a single E.164 string.
export function toE164(countryCode, phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  const cc = String(countryCode || '').replace(/\D/g, '');
  if (!digits || !cc) return null;
  return `+${cc}${digits}`;
}

export function formatMoney(amount, currency) {
  try {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'USD' ? 2 : 0,
      minimumFractionDigits: currency === 'USD' ? 2 : 0,
    }).format(Number(amount));
  } catch {
    return `${currency} ${amount}`;
  }
}

export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export async function getUserContact(sql, userId) {
  const rows = await sql`SELECT email, real_name, profile_name FROM users WHERE id = ${userId}`;
  const row = rows[0];
  if (!row) return null;
  return { email: row.email, name: row.real_name || row.profile_name };
}

// Generic in-app notification (bell icon + profile Messages tab). Always
// writes the row; only sends an email when the caller passes `email` —
// callers that already sent their own email (e.g. notifyOutbid below)
// should omit it rather than double-send.
//
// Pass `id` for a notification that must exist at most once (e.g. "your
// auction ended"): a repeat insert is ignored and nothing is emailed, which
// makes it safe for several requests to race to send the same one.
export async function createNotification({ sql, userId, type, title, body, link, email, name, id: fixedId }) {
  const id = fixedId || `notif_${randomUUID()}`;
  const inserted = await sql`
    INSERT INTO notifications (id, user_id, type, title, body, link)
    VALUES (${id}, ${userId}, ${type}, ${title}, ${body || null}, ${link || null})
    ON CONFLICT (id) DO NOTHING
    RETURNING id
  `;
  if (fixedId && inserted.length === 0) return null;
  if (email) {
    const appUrl = process.env.APP_URL || 'https://subasti.vercel.app';
    const fullLink = link ? `${appUrl}${link}` : appUrl;
    const html = `
      <p>Hola ${escapeHtml(name || '')},</p>
      <p>${escapeHtml(body || title)}</p>
      <p><a href="${fullLink}">Ver en Subasti</a></p>
      <p>— Subasti</p>
    `;
    try {
      await sendEmail({ to: email, subject: title, html });
    } catch (err) {
      console.error('Notification email failed:', err.message);
    }
  }
  return id;
}

// Tells a seller their item just sold (payment secured in escrow). Best-effort
// like the other notifiers: failures are logged, never thrown, so a
// notification problem can't fail a checkout that already took payment.
export async function notifySellerOfSale({ sql, sellerId, itemTitle, quantity }) {
  try {
    const seller = await getUserContact(sql, sellerId);
    if (!seller) return;
    const qtyLabel = quantity > 1 ? ` (x${quantity})` : '';
    await createNotification({
      sql,
      userId: sellerId,
      type: 'order_status',
      title: `¡Vendiste "${itemTitle}"${qtyLabel}!`,
      body: 'El pago está asegurado en depósito. Envía el artículo dentro de las próximas 48 horas.',
      link: '/profile?tab=selling',
      email: seller.email,
      name: seller.name,
    });
  } catch (err) {
    console.error('Sale notification failed:', err.message);
  }
}

// Notifies whoever was the highest bidder immediately before this new bid —
// not the item's whole bid history, so people outbid days ago don't get
// re-pinged on every later bid. Best-effort: callers should catch, never
// let a notification failure fail the bid itself.
export async function notifyOutbid({ sql, previousBidderId, item }) {
  const rows = await sql`SELECT email, country_code, phone, real_name FROM users WHERE id = ${previousBidderId}`;
  const user = rows[0];
  if (!user) return;

  const appUrl = process.env.APP_URL || 'https://subasti.vercel.app';
  const itemUrl = `${appUrl}/item/${item.id}`;
  const amount = formatMoney(item.current_bid, item.currency);
  const title = item.title;

  const subject = `Te superaron la puja en "${title}"`;
  const html = `
    <p>Hola ${escapeHtml(user.real_name || '')},</p>
    <p>Alguien hizo una puja más alta en <strong>${escapeHtml(title)}</strong>. La puja actual ahora es <strong>${amount}</strong>.</p>
    <p><a href="${itemUrl}">Haz una nueva puja</a> antes de que termine la subasta.</p>
    <p>— Subasti</p>
  `;
  const smsBody = `Subasti: te superaron la puja en "${title}". Puja actual: ${amount}. Puja de nuevo: ${itemUrl}`;

  const tasks = [];
  if (user.email) {
    tasks.push(sendEmail({ to: user.email, subject, html }).catch((err) => console.error('Outbid email failed:', err.message)));
  }
  const phoneE164 = toE164(user.country_code, user.phone);
  if (phoneE164) {
    tasks.push(sendSms({ to: phoneE164, body: smsBody }).catch((err) => console.error('Outbid SMS failed:', err.message)));
  }
  // In-app record for the bell icon / Messages tab — no `email` passed here
  // since the direct sendEmail above already covers it.
  tasks.push(createNotification({
    sql,
    userId: previousBidderId,
    type: 'outbid',
    title: subject,
    body: `La puja actual ahora es ${amount}.`,
    link: `/item/${item.id}`,
  }).catch((err) => console.error('Outbid notification row failed:', err.message)));
  await Promise.allSettled(tasks);
}

// Tells everyone who bid on an auction but didn't win it that it has ended:
// outbid, reserve price not reached, or bought outright via Buy Now. There is
// no background worker, so this sweep is run from places that execute often
// (the notification poll, a daily cron) and is idempotent — each bidder gets
// exactly one notification per auction, keyed by a deterministic id. Only
// auctions that ended in the last LOOKBACK_DAYS are considered, so turning
// this on doesn't blast people about ancient auctions.
const LOOKBACK_DAYS = 7;
const SWEEP_BATCH = 200;

export async function notifyEndedAuctionLosers(sql) {
  const rows = await sql`
    SELECT i.id, i.title, i.currency, i.current_bid, i.highest_bidder_id,
           b.bidder_id, b.my_max,
           (i.reserve_price IS NOT NULL AND i.current_bid < i.reserve_price) AS reserve_missed,
           EXISTS (SELECT 1 FROM orders o WHERE o.item_id = i.id AND o.order_type = 'buy_now') AS bought_outright
    FROM items i
    JOIN (
      SELECT item_id, bidder_id, MAX(amount) AS my_max
      FROM bid_history GROUP BY item_id, bidder_id
    ) b ON b.item_id = i.id
    WHERE i.sale_type = 'auc'
      AND i.end_at < now()
      AND i.end_at > now() - (${LOOKBACK_DAYS} * interval '1 day')
      AND (
        i.highest_bidder_id IS DISTINCT FROM b.bidder_id
        OR (i.reserve_price IS NOT NULL AND i.current_bid < i.reserve_price)
        OR EXISTS (SELECT 1 FROM orders o WHERE o.item_id = i.id AND o.order_type = 'buy_now')
      )
      AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.item_id = i.id AND o.buyer_id = b.bidder_id)
      AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.id = 'notif_auctionlost_' || i.id || '_' || b.bidder_id)
    LIMIT ${SWEEP_BATCH}
  `;

  let sent = 0;
  for (const r of rows) {
    try {
      const mine = formatMoney(r.my_max, r.currency);
      let body;
      if (r.bought_outright) {
        body = `El artículo se vendió por compra inmediata antes de que terminara la subasta. Tu puja más alta fue ${mine}.`;
      } else if (r.reserve_missed) {
        body = `No se alcanzó el precio de reserva, por lo que la subasta terminó sin venta. Tu puja más alta fue ${mine}.`;
      } else {
        body = `Otra persona ganó con ${formatMoney(r.current_bid, r.currency)}. Tu puja más alta fue ${mine}.`;
      }
      const contact = await getUserContact(sql, r.bidder_id);
      const id = await createNotification({
        sql,
        id: `notif_auctionlost_${r.id}_${r.bidder_id}`,
        userId: r.bidder_id,
        type: 'auction_lost',
        title: `La subasta de "${r.title}" terminó y no la ganaste`,
        body,
        link: `/item/${r.id}`,
        email: contact?.email,
        name: contact?.name,
      });
      if (id) sent += 1;
    } catch (err) {
      console.error('Auction-lost notification failed for item', r.id, err.message);
    }
  }
  return sent;
}
