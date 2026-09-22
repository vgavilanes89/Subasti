import { del } from '@vercel/blob';
import { getSql } from '../_lib/db.js';
import { getRequestingAdmin } from '../_lib/admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Only the admin panel calls this today — no seller-facing "delete my
  // listing" UI exists yet, so gate on admin rather than ownership.
  const admin = await getRequestingAdmin(req);
  if (!admin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const id = typeof body.id === 'string' ? body.id : '';
  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }

  const sql = getSql();
  const rows = await sql`DELETE FROM items WHERE id = ${id} RETURNING id, images`;
  if (!rows[0]) {
    return res.status(404).json({ error: 'Item not found' });
  }

  // Best-effort: only clean up blobs actually in our store (skips e.g. the
  // placehold.co URLs on old demo listings), and never let a cleanup
  // failure undo the deletion that already succeeded.
  const images = Array.isArray(rows[0].images) ? rows[0].images : [];
  const blobUrls = images.filter((u) => typeof u === 'string' && u.includes('.blob.vercel-storage.com'));
  if (blobUrls.length > 0) {
    try {
      await del(blobUrls);
    } catch (err) {
      console.error('Failed to delete blob(s) for item', id, err.message);
    }
  }

  return res.status(200).json({ id: rows[0].id });
}
