import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest, clearSessionCookie, createSessionToken, setSessionCookie } from '../_lib/session.js';

// Renews the idle timeout. Sent by the page only in response to real user
// activity; background polling (chat, notifications) deliberately does not
// call it, or an abandoned open tab would never time out.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const sql = getSql();
    const rows = await sql`SELECT id, is_suspended FROM users WHERE id = ${userId}`;
    // A deleted or suspended account loses its session at the next renewal.
    if (!rows[0] || rows[0].is_suspended) {
      clearSessionCookie(res);
      return res.status(401).json({ error: 'Not authenticated' });
    }
    setSessionCookie(res, createSessionToken(String(rows[0].id)));
    return res.status(204).end();
  } catch {
    // Don't end someone's session over a transient failure; they'll retry.
    return res.status(500).json({ error: 'Could not renew session' });
  }
}
