import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';
import { toPublicThread, generateThreadId } from '../_lib/messages.js';
import { getItemById } from '../_lib/items.js';

// Buyer-initiated thread about a specific item. sellerId/itemTitle are
// looked up server-side from the item rather than trusted from the client.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buyerId = getUserIdFromRequest(req);
  if (!buyerId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const itemId = typeof body.itemId === 'string' ? body.itemId : '';
  if (!itemId) {
    return res.status(400).json({ error: 'itemId is required' });
  }

  const sql = getSql();
  const item = await getItemById(sql, itemId);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  if (item.sellerId === buyerId) {
    return res.status(400).json({ error: 'OWN_ITEM' });
  }

  const existing = await sql`SELECT * FROM message_threads WHERE item_id = ${itemId} AND buyer_id = ${buyerId}`;
  let row = existing[0];
  if (!row) {
    const id = generateThreadId();
    const inserted = await sql`
      INSERT INTO message_threads (id, item_id, item_title, seller_id, buyer_id)
      VALUES (${id}, ${itemId}, ${item.title}, ${item.sellerId}, ${buyerId})
      ON CONFLICT (item_id, buyer_id) DO NOTHING
      RETURNING *
    `;
    row = inserted[0] || (await sql`SELECT * FROM message_threads WHERE item_id = ${itemId} AND buyer_id = ${buyerId}`)[0];
  }

  return res.status(200).json(toPublicThread(row, []));
}
