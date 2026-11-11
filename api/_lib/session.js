import jwt from 'jsonwebtoken';

export const SESSION_COOKIE = 'subasti_session';
// Idle timeout: a session lasts 3 hours from its last renewal. The page renews
// it (POST /api/auth/keepalive, and /api/auth/me on load) only when the person
// actually uses the site, so 3 hours without activity ends the session.
const SESSION_TTL_SECONDS = 3 * 60 * 60;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET is not configured');
  }
  return secret;
}

export function createSessionToken(userId) {
  return jwt.sign({ sub: userId }, getSecret(), { expiresIn: SESSION_TTL_SECONDS });
}

export function verifySessionToken(token) {
  try {
    // maxAge checks `iat`, so the old 30-day tokens issued before this limit
    // existed are rejected too instead of lingering for a month.
    const payload = jwt.verify(token, getSecret(), { maxAge: SESSION_TTL_SECONDS });
    return payload.sub;
  } catch {
    return null;
  }
}

export function setSessionCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ];
  if (isProd) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(res) {
  const isProd = process.env.NODE_ENV === 'production';
  const parts = [`${SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (isProd) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function getUserIdFromRequest(req) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  return verifySessionToken(token);
}
