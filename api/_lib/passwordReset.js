import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';

const RESET_TTL_SECONDS = 60 * 60; // 1 hour

// Derived from the session secret so a reset token can never be accepted as a
// session token (or vice versa) even though both are JWTs.
function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET is not configured');
  }
  return `${secret}:password-reset`;
}

// Tied to the current password hash, so changing the password (via this reset
// or any other way) instantly invalidates every outstanding link. That makes a
// link single-use without storing anything in the database.
function passwordFingerprint(passwordHash) {
  return createHash('sha256').update(String(passwordHash)).digest('hex').slice(0, 24);
}

export function createResetToken(userRow) {
  return jwt.sign(
    { sub: String(userRow.id), fp: passwordFingerprint(userRow.password_hash) },
    getSecret(),
    { expiresIn: RESET_TTL_SECONDS },
  );
}

// Returns the token's user id, or null if it's expired/forged. The caller
// must still compare the fingerprint against the user's current password.
export function verifyResetToken(token) {
  try {
    const payload = jwt.verify(token, getSecret());
    return { userId: payload.sub, fingerprint: payload.fp };
  } catch {
    return null;
  }
}

export function fingerprintMatches(userRow, fingerprint) {
  return passwordFingerprint(userRow.password_hash) === fingerprint;
}
