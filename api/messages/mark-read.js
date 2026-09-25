import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';
import { toPublicThread, getThreadById } from '../_lib/messages.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const threadId = typeof body.threadId === 'string' ? body.threadId : '';

  const sql = getSql();
  const thread = await getThreadById(sql, threadId);
  if (!thread) {
    return res.status(404).json({ error: 'Thread not found' });
  }
  if (thread.seller_id !== userId && thread.buyer_id !== userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (userId === thread.seller_id) {
    await sql`UPDATE message_threads SET seller_last_read_at = now() WHERE id = ${threadId}`;
  } else {
    await sql`UPDATE message_threads SET buyer_last_read_at = now() WHERE id = ${threadId}`;
  }

  const refreshedRows = await sql`SELECT * FROM message_threads WHERE id = ${threadId}`;
  const messages = await sql`SELECT * FROM thread_messages WHERE thread_id = ${threadId} ORDER BY created_at ASC`;
  return res.status(200).json(toPublicThread(refreshedRows[0], messages));
}
