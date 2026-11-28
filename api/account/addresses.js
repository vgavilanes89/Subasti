import { getSql } from '../_lib/db.js';
import { getActiveUserId } from '../_lib/session.js';
import {
  MAX_ADDRESSES, parseAddress, toPublicAddress, generateAddressId,
} from '../_lib/wallet.js';

// A buyer's own saved delivery addresses. Every query is scoped to the
// signed-in user, so one user can never read or change another's. Each call
// answers with the full updated list so the client just replaces its state.
async function list(sql, userId) {
  const rows = await sql`
    SELECT * FROM saved_addresses WHERE user_id = ${userId}
    ORDER BY is_default DESC, created_at DESC
  `;
  return rows.map(toPublicAddress);
}

const makeDefault = async (sql, userId, id) => {
  await sql`UPDATE saved_addresses SET is_default = (id = ${id}) WHERE user_id = ${userId}`;
};

export default async function handler(req, res) {
  const userId = await getActiveUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const sql = getSql();
  const body = typeof req.body === 'object' && req.body ? req.body : {};

  try {
    if (req.method === 'GET') {
      return res.status(200).json({ addresses: await list(sql, userId) });
    }

    if (req.method === 'POST') {
      const parsed = parseAddress(body);
      if (parsed.error) return res.status(400).json({ error: parsed.error });

      const count = await sql`SELECT COUNT(*)::int AS n FROM saved_addresses WHERE user_id = ${userId}`;
      if (count[0].n >= MAX_ADDRESSES) return res.status(409).json({ error: 'TOO_MANY_ADDRESSES' });

      const a = parsed.value;
      const id = generateAddressId();
      await sql`
        INSERT INTO saved_addresses (id, user_id, alias, full_name, address, city, province, postal_code, country, is_default)
        VALUES (${id}, ${userId}, ${a.alias}, ${a.fullName}, ${a.address}, ${a.city}, ${a.province}, ${a.postalCode}, ${a.country}, FALSE)
      `;
      // The first address, or one explicitly marked, becomes the default.
      if (count[0].n === 0 || body.makeDefault === true) await makeDefault(sql, userId, id);
      return res.status(201).json({ addresses: await list(sql, userId), id });
    }

    if (req.method === 'PUT') {
      const id = typeof body.id === 'string' ? body.id : '';
      const parsed = parseAddress(body);
      if (parsed.error) return res.status(400).json({ error: parsed.error });
      const a = parsed.value;
      const updated = await sql`
        UPDATE saved_addresses
        SET alias = ${a.alias}, full_name = ${a.fullName}, address = ${a.address}, city = ${a.city},
            province = ${a.province}, postal_code = ${a.postalCode}
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING id
      `;
      if (!updated[0]) return res.status(404).json({ error: 'NOT_FOUND' });
      if (body.makeDefault === true) await makeDefault(sql, userId, id);
      return res.status(200).json({ addresses: await list(sql, userId) });
    }

    if (req.method === 'PATCH') {
      const id = typeof body.id === 'string' ? body.id : '';
      const exists = await sql`SELECT 1 FROM saved_addresses WHERE id = ${id} AND user_id = ${userId}`;
      if (!exists[0]) return res.status(404).json({ error: 'NOT_FOUND' });
      await makeDefault(sql, userId, id);
      return res.status(200).json({ addresses: await list(sql, userId) });
    }

    if (req.method === 'DELETE') {
      const id = typeof req.query.id === 'string' ? req.query.id : '';
      const removed = await sql`
        DELETE FROM saved_addresses WHERE id = ${id} AND user_id = ${userId} RETURNING is_default
      `;
      if (!removed[0]) return res.status(404).json({ error: 'NOT_FOUND' });
      // Deleting the default promotes the most recent remaining address.
      if (removed[0].is_default) {
        const next = await sql`SELECT id FROM saved_addresses WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 1`;
        if (next[0]) await makeDefault(sql, userId, next[0].id);
      }
      return res.status(200).json({ addresses: await list(sql, userId) });
    }

    res.setHeader('Allow', 'GET, POST, PUT, PATCH, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Saved addresses error:', err.message);
    return res.status(500).json({ error: 'REQUEST_FAILED' });
  }
}
