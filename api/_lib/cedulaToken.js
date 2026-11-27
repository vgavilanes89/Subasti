import jwt from 'jsonwebtoken';

// Proof that the cédula lookup returned a name. /api/cedula signs it, sign-up
// requires it, so an account can't be created for a number that brought back no
// name — and the name on the account is the registry's, not whatever the browser
// sends. It avoids paying for a second lookup at sign-up.
const TTL_SECONDS = 30 * 60;

function getSecret() {
  const base = process.env.SESSION_SECRET;
  if (!base) throw new Error('SESSION_SECRET is not configured');
  // A distinct secret, so this token can never be used as a login session.
  return `${base}:cedula`;
}

export const createCedulaToken = (cedula, fullName) =>
  jwt.sign({ cedula, name: fullName }, getSecret(), { expiresIn: TTL_SECONDS });

// The verified full name for this cédula, or null (missing, forged, expired, or
// issued for a different number).
export function verifiedNameFor(token, cedula) {
  if (typeof token !== 'string' || !token) return null;
  try {
    const payload = jwt.verify(token, getSecret());
    return payload.cedula === cedula && payload.name ? payload.name : null;
  } catch {
    return null;
  }
}
