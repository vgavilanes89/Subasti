import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import { sendEmail, escapeHtml } from './notify.js';

// Confirming that a new account's email address is really theirs.
//
// Off until REQUIRE_EMAIL_CONFIRMATION=true. Turning it on before email can be
// delivered to anyone (a verified sending domain) would lock new users out.
export const confirmationOn = () => process.env.REQUIRE_EMAIL_CONFIRMATION === 'true';

const LINK_TTL_SECONDS = 48 * 60 * 60;

// Its own key, so a confirmation link can never be used as a session.
function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not configured');
  return `${secret}:email-confirm`;
}

// Ties a link to the address it was sent to: changing the address kills it.
const emailFingerprint = (email) => createHash('sha256').update(String(email).toLowerCase()).digest('hex').slice(0, 24);

export const createEmailToken = (row) =>
  jwt.sign({ sub: String(row.id), em: emailFingerprint(row.email) }, getSecret(), { expiresIn: LINK_TTL_SECONDS });

export function readEmailToken(token) {
  try {
    const payload = jwt.verify(token, getSecret());
    return { userId: payload.sub, matches: (email) => emailFingerprint(email) === payload.em };
  } catch {
    return null;
  }
}

// Throws if the message can't be handed to the email service.
export async function sendConfirmationEmail(row) {
  const appUrl = process.env.APP_URL || 'https://subasti.vercel.app';
  const link = `${appUrl}/verify-email?token=${encodeURIComponent(createEmailToken(row))}`;
  if (process.env.VERCEL_ENV !== 'production') {
    console.log(`[dev] email confirmation link for ${row.email}: ${link}`);
  }
  const name = escapeHtml(row.real_name || row.profile_name || '');
  await sendEmail({
    to: row.email,
    subject: 'Confirma tu correo en Subasti / Confirm your Subasti email',
    html: `
      <p>Hola ${name},</p>
      <p>Confirma tu correo para pujar, comprar y vender en Subasti. Este enlace funciona durante 48 horas:</p>
      <p><a href="${link}">Confirmar mi correo</a></p>
      <p>Si no creaste esta cuenta, ignora este mensaje.</p>
      <hr />
      <p>Hi ${name},</p>
      <p>Confirm your email to bid, buy and sell on Subasti. This link works for 48 hours:</p>
      <p><a href="${link}">Confirm my email</a></p>
      <p>If you didn't create this account, ignore this message.</p>
      <p>— Subasti</p>
    `,
  });
}

export const isUnconfirmed = (row) =>
  confirmationOn() && Boolean(row?.email_confirm_required) && !row?.email_verified_at;

// For actions that need a confirmed email. Sends the 403 itself and returns
// true when the request should stop.
export async function blockUnconfirmed(sql, userId, res) {
  if (!confirmationOn()) return false;
  try {
    const row = (await sql`SELECT email_confirm_required, email_verified_at FROM users WHERE id = ${userId}`)[0];
    if (!isUnconfirmed(row)) return false;
  } catch (err) {
    // e.g. sql/027 not run yet: don't lock everyone out.
    console.error('Could not check email confirmation:', err.message);
    return false;
  }
  res.status(403).json({ error: 'EMAIL_NOT_CONFIRMED' });
  return true;
}
