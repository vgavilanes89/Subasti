import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';
import { toPublicThread, generateMessageId, getThreadById } from '../_lib/messages.js';
import { sendEmail, escapeHtml } from '../_lib/notify.js';

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
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) {
    return res.status(400).json({ error: 'EMPTY_MESSAGE' });
  }

  const sql = getSql();
  const thread = await getThreadById(sql, threadId);
  if (!thread) {
    return res.status(404).json({ error: 'Thread not found' });
  }
  if (thread.seller_id !== userId && thread.buyer_id !== userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const id = generateMessageId();
  await sql`
    INSERT INTO thread_messages (id, thread_id, sender_id, body)
    VALUES (${id}, ${threadId}, ${userId}, ${text})
  `;

  // Sending your own message counts as reading up through it too, so the
  // sender's own unread count doesn't tick up from what they just sent.
  if (userId === thread.seller_id) {
    await sql`UPDATE message_threads SET seller_last_read_at = now() WHERE id = ${threadId}`;
  } else {
    await sql`UPDATE message_threads SET buyer_last_read_at = now() WHERE id = ${threadId}`;
  }

  const recipientId = userId === thread.seller_id ? thread.buyer_id : thread.seller_id;
  const senderRows = await sql`SELECT profile_name FROM users WHERE id = ${userId}`;
  const recipientRows = await sql`SELECT email, real_name, profile_name FROM users WHERE id = ${recipientId}`;
  const recipient = recipientRows[0];
  const senderName = senderRows[0]?.profile_name || 'Subasti';

  if (recipient?.email) {
    const appUrl = process.env.APP_URL || 'https://subasti.vercel.app';
    const link = `${appUrl}/profile?tab=messages`;
    const subject = `Nuevo mensaje de ${senderName}${thread.item_title ? ` sobre "${thread.item_title}"` : ''}`;
    const html = `
      <p>Hola ${escapeHtml(recipient.real_name || recipient.profile_name || '')},</p>
      <p><strong>${escapeHtml(senderName)}</strong> te escribió:</p>
      <p style="padding:12px;background:#f3f4f6;border-radius:8px;">${escapeHtml(text)}</p>
      <p><a href="${link}">Responder en Subasti</a></p>
      <p>— Subasti</p>
    `;
    try {
      await sendEmail({ to: recipient.email, subject, html });
    } catch (err) {
      console.error('Message email failed:', err.message);
    }
  }

  const refreshedRows = await sql`SELECT * FROM message_threads WHERE id = ${threadId}`;
  const messages = await sql`SELECT * FROM thread_messages WHERE thread_id = ${threadId} ORDER BY created_at ASC`;
  return res.status(200).json(toPublicThread(refreshedRows[0], messages));
}
