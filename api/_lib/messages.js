import { randomUUID } from 'crypto';

export function generateThreadId() {
  return `thread_${randomUUID()}`;
}

export function generateMessageId() {
  return `msg_${randomUUID()}`;
}

// Matches the shape the old client-side mock (src/api/messages.js) used, so
// MessagesContext/ChatPanel/BuyerDashboard/SellerDashboard/AdminPage don't
// need to change: unread counts are derived from each side's last-read
// timestamp rather than stored as a running counter.
export function toPublicThread(row, messages) {
  const sellerLastRead = row.seller_last_read_at ? new Date(row.seller_last_read_at).getTime() : 0;
  const buyerLastRead = row.buyer_last_read_at ? new Date(row.buyer_last_read_at).getTime() : 0;

  const mapped = messages.map((m) => ({
    id: m.id,
    from: m.sender_id,
    text: m.body,
    at: new Date(m.created_at).getTime(),
    viaEmail: false,
  }));

  const unreadForSeller = mapped.filter((m) => m.from === row.buyer_id && m.at > sellerLastRead).length;
  const unreadForBuyer = mapped.filter((m) => m.from === row.seller_id && m.at > buyerLastRead).length;

  return {
    id: row.id,
    sellerId: row.seller_id,
    buyerId: row.buyer_id,
    itemId: row.item_id,
    itemTitle: row.item_title,
    unreadForSeller,
    unreadForBuyer,
    messages: mapped,
    lastMessageAt: mapped.length ? Math.max(...mapped.map((m) => m.at)) : new Date(row.created_at).getTime(),
  };
}

export async function getThreadById(sql, threadId) {
  const rows = await sql`SELECT * FROM message_threads WHERE id = ${threadId}`;
  return rows[0] || null;
}
