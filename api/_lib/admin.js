import { getSql } from './db.js';
import { getUserIdFromRequest } from './session.js';

// Resolves the requesting user's own row, but only if they're an admin.
// Returns null for unauthenticated requests and non-admin requesters alike,
// so callers can respond with a single 403 either way.
export async function getRequestingAdmin(req) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return null;

  const sql = getSql();
  const rows = await sql`SELECT * FROM users WHERE id = ${userId}`;
  const row = rows[0];
  if (!row || !row.is_admin) return null;
  return row;
}
