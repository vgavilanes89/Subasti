import { getSql } from '../_lib/db.js';
import { createRateLimiter, getClientIp } from '../_lib/rateLimit.js';
import { createResetToken } from '../_lib/passwordReset.js';
import { sendEmail, escapeHtml } from '../_lib/notify.js';

// Tight on purpose: each hit can trigger an outbound email.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 1000;
const isRateLimited = createRateLimiter(RATE_LIMIT, RATE_WINDOW_MS);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (isRateLimited(getClientIp(req))) {
    res.setHeader('Retry-After', String(RATE_WINDOW_MS / 1000));
    return res.status(429).json({ error: 'Too many attempts, please try again shortly' });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || email.length > 254) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Same response whether or not the account exists, so this can't be used to
  // find out who has an account.
  const genericResponse = () => res.status(200).json({ ok: true });

  try {
    const sql = getSql();
    const rows = await sql`SELECT * FROM users WHERE email = ${email}`;
    const row = rows[0];
    if (!row || row.is_suspended) {
      return genericResponse();
    }

    const appUrl = process.env.APP_URL || 'https://subasti.vercel.app';
    const link = `${appUrl}/reset-password?token=${encodeURIComponent(createResetToken(row))}`;

    if (process.env.VERCEL_ENV !== 'production') {
      console.log(`[dev] password reset link for ${email}: ${link}`);
    }

    const name = escapeHtml(row.real_name || row.profile_name || '');
    await sendEmail({
      to: row.email,
      subject: 'Restablece tu contraseña de Subasti / Reset your Subasti password',
      html: `
        <p>Hola ${name},</p>
        <p>Recibimos una solicitud para restablecer tu contraseña. Este enlace funciona durante 1 hora:</p>
        <p><a href="${link}">Restablecer mi contraseña</a></p>
        <p>Si no fuiste tú, ignora este correo: tu contraseña no cambiará.</p>
        <hr />
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. This link works for 1 hour:</p>
        <p><a href="${link}">Reset my password</a></p>
        <p>If this wasn't you, ignore this email — your password won't change.</p>
        <p>— Subasti</p>
      `,
    }).catch((err) => console.error('Password reset email failed:', err.message));

    return genericResponse();
  } catch (err) {
    console.error('Forgot password failed:', err.message);
    // Still generic: a failure here must not reveal anything either.
    return genericResponse();
  }
}
