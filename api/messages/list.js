import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';
import { toPublicThread } from '../_lib/messages.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const sql = getSql();
  const threads = await sql`
    SELECT * FROM message_threads WHERE seller_id = ${userId} OR buyer_id = ${userId}
  `;
  if (threads.length === 0) {
    return res.status(200).json([]);
  }

  const threadIds = threads.map((t) => t.id);
  const messages = await sql`
    SELECT * FROM thread_messages WHERE thread_id = ANY(${threadIds}) ORDER BY created_at ASC
  `;
  const byThread = new Map();
  for (const m of messages) {
    if (!byThread.has(m.thread_id)) byThread.set(m.thread_id, []);
    byThread.get(m.thread_id).push(m);
  }

  const result = threads
    .map((t) => toPublicThread(t, byThread.get(t.id) || []))
    .sort((a, b) => b.lastMessageAt - a.lastMessageAt);

  return res.status(200).json(result);
}
