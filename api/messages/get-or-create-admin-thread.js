import { getSql } from '../_lib/db.js';
import { getRequestingAdmin } from '../_lib/admin.js';
import { toPublicThread, generateThreadId } from '../_lib/messages.js';

// Admin support threads reuse the same seller/buyer plumbing (unread
// tracking, ChatPanel's rendering) by putting the admin on the seller side
// and the target user on the buyer side, with a fixed itemId so each admin
// has exactly one ongoing thread per user instead of a real item.
const ADMIN_THREAD_ITEM_ID = 'admin_support';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await getRequestingAdmin(req);
  if (!admin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const targetUserId = typeof body.targetUserId === 'string' ? body.targetUserId : '';
  if (!targetUserId) {
    return res.status(400).json({ error: 'targetUserId is required' });
  }

  const sql = getSql();
  const existing = await sql`SELECT * FROM message_threads WHERE item_id = ${ADMIN_THREAD_ITEM_ID} AND buyer_id = ${targetUserId}`;
  let row = existing[0];
  if (!row) {
    const id = generateThreadId();
    const inserted = await sql`
      INSERT INTO message_threads (id, item_id, item_title, seller_id, buyer_id)
      VALUES (${id}, ${ADMIN_THREAD_ITEM_ID}, 'Subasti Support', ${String(admin.id)}, ${targetUserId})
      ON CONFLICT (item_id, buyer_id) DO NOTHING
      RETURNING *
    `;
    row = inserted[0] || (await sql`SELECT * FROM message_threads WHERE item_id = ${ADMIN_THREAD_ITEM_ID} AND buyer_id = ${targetUserId}`)[0];
  }

  return res.status(200).json(toPublicThread(row, []));
}
