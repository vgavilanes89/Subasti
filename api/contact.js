import { getSql } from './_lib/db.js';
import { getUserIdFromRequest } from './_lib/session.js';
import { sendEmail, escapeHtml } from './_lib/notify.js';
import { createRateLimiter, getClientIp } from './_lib/rateLimit.js';

// Contact form: emails the message to the support inbox (SUPPORT_EMAIL), with
// Reply-To set to the sender so support can just hit reply. Deliberately does
// NOT email the sender back (that would let anyone make us email arbitrary
// addresses). It only ever reports success when the email was really handed
// to the mail service — never a fake "sent".
const TOPICS = ['order', 'selling', 'account', 'payments', 'complaint', 'other'];
const TOPIC_LABELS = {
  order: 'Un pedido / An order',
  selling: 'Vender / Selling',
  account: 'Mi cuenta / My account',
  payments: 'Pagos / Payments',
  complaint: 'Queja / Complaint',
  other: 'Otro / Other',
};
const MAX_MESSAGE = 2000;
const MIN_MESSAGE = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isRateLimited = createRateLimiter(5, 60 * 60 * 1000); // 5 messages / hour / IP

const oneLine = (value, max) => String(value || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};

  // Honeypot: real people never see or fill this hidden field, bots do.
  // Pretend it worked so they don't adapt.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return res.status(200).json({ ok: true });
  }

  const name = oneLine(body.name, 100);
  const email = oneLine(body.email, 200);
  const topic = TOPICS.includes(body.topic) ? body.topic : 'other';
  const reference = oneLine(body.reference, 60);
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, MAX_MESSAGE) : '';

  if (!name) return res.status(400).json({ error: 'NAME_REQUIRED' });
  if (!EMAIL_PATTERN.test(email)) return res.status(400).json({ error: 'INVALID_EMAIL' });
  if (message.length < MIN_MESSAGE) return res.status(400).json({ error: 'MESSAGE_TOO_SHORT' });

  const supportEmail = process.env.SUPPORT_EMAIL;
  if (!supportEmail) {
    console.error('Contact form: SUPPORT_EMAIL is not configured');
    return res.status(503).json({ error: 'SUPPORT_NOT_CONFIGURED' });
  }

  if (isRateLimited(getClientIp(req))) {
    return res.status(429).json({ error: 'RATE_LIMITED' });
  }

  // If they're signed in, tell support who they are so their orders can be found fast.
  let account = '';
  const userId = getUserIdFromRequest(req);
  if (userId) {
    try {
      const rows = await getSql()`SELECT email, profile_name, real_name FROM users WHERE id = ${userId}`;
      const u = rows[0];
      if (u) {
        account = `<p><strong>Cuenta / Account:</strong> usuario #${escapeHtml(String(userId))} — ${escapeHtml(u.profile_name || '')} (${escapeHtml(u.real_name || '')}), ${escapeHtml(u.email || '')}</p>`;
      }
    } catch (err) {
      console.error('Contact form: account lookup failed:', err.message);
    }
  }

  const html = `
    <p><strong>De / From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
    <p><strong>Tema / Topic:</strong> ${escapeHtml(TOPIC_LABELS[topic])}</p>
    ${reference ? `<p><strong>Pedido o artículo / Order or item:</strong> ${escapeHtml(reference)}</p>` : ''}
    ${account}
    <hr/>
    <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
  `;

  try {
    const result = await sendEmail({
      to: supportEmail,
      replyTo: email,
      subject: `[Contacto] ${TOPIC_LABELS[topic]} — ${name}`,
      html,
    });
    if (result?.skipped) {
      // No email service configured: don't claim the message was delivered.
      return res.status(503).json({ error: 'SUPPORT_NOT_CONFIGURED' });
    }
  } catch (err) {
    console.error('Contact form: send failed:', err.message);
    return res.status(502).json({ error: 'SEND_FAILED' });
  }

  return res.status(200).json({ ok: true });
}
