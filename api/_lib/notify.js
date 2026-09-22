// Thin REST clients for Resend (email) and Twilio (SMS) — plain fetch calls
// rather than their SDKs so there's nothing new for Vercel's bundler to
// mis-trace (see the @vercel/blob/client lesson: a subpath export's chunk
// silently failed to bundle in production even though it worked locally).
// Both no-op (return { skipped: true }) when their env vars aren't set yet,
// so bidding keeps working before/while these are provisioned.

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

function formatMoney(amount, currency) {
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

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
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
  await Promise.allSettled(tasks);
}
