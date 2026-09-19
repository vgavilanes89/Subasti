import { randomUUID } from 'crypto';
import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';

// Search itself stays entirely client-side (instant filtering over the
// already-loaded item list) — this is a fire-and-forget log call so admin
// analytics can see what people search for, not a dependency of search
// actually working.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const query = typeof body.query === 'string' ? body.query.trim().slice(0, 200) : '';
  const resultCount = Number.isFinite(body.resultCount) ? Math.max(0, Math.floor(body.resultCount)) : 0;
  if (!query) {
    return res.status(400).json({ error: 'query is required' });
  }

  const userId = getUserIdFromRequest(req);
  const sql = getSql();
  await sql`
    INSERT INTO search_events (id, query, result_count, user_id)
    VALUES (${`search_${randomUUID()}`}, ${query}, ${resultCount}, ${userId})
  `;
  return res.status(204).end();
}
