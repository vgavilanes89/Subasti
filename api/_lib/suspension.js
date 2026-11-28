import { createNotification, getUserContact, formatMoney } from './notify.js';

// What happens to a suspended account's bids on auctions that are still
// running: they are cancelled. The rows stay in bid_history, marked, and the
// price drops back to the best remaining bid. Reinstating the account does not
// bring them back. (Auctions that have already ended are left as they are.)

const MAX_ATTEMPTS = 3;

const tell = async (sql, userId, title, body, itemId) => {
  try {
    const contact = await getUserContact(sql, userId);
    await createNotification({
      sql, userId, type: 'order_status', title, body, link: `/item/${itemId}`, email: contact?.email, name: contact?.name,
    });
  } catch (err) {
    console.error('Cancelled-bid notification failed:', err.message);
  }
};

async function repriceAuction(sql, itemId, userId, removed) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const item = (await sql`SELECT * FROM items WHERE id = ${itemId}`)[0];
    if (!item) return;

    // Only touch the price if they were leading. If someone else is, their bid
    // stands, and may not even have reached bid_history yet.
    const wasLeading = item.highest_bidder_id === userId;
    let amount = item.current_bid;
    let leader = item.highest_bidder_id;
    if (wasLeading) {
      const next = (await sql`
        SELECT h.bidder_id, h.amount FROM bid_history h
        WHERE h.item_id = ${itemId} AND h.cancelled_at IS NULL AND h.bidder_id <> ${userId}
          AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id::text = h.bidder_id AND u.is_suspended)
        ORDER BY h.amount DESC, h.placed_at ASC LIMIT 1
      `)[0];
      amount = next ? next.amount : item.price;
      leader = next ? next.bidder_id : null;
    }
    const count = leader ? Math.max(0, Number(item.bids) - removed) : 0;

    // Guarded on what was just read, so a bid landing now isn't overwritten.
    const updated = await sql`
      UPDATE items SET current_bid = ${amount}, highest_bidder_id = ${leader}, bids = ${count}
      WHERE id = ${itemId}
        AND current_bid IS NOT DISTINCT FROM ${item.current_bid}
        AND bids IS NOT DISTINCT FROM ${item.bids}
        AND highest_bidder_id IS NOT DISTINCT FROM ${item.highest_bidder_id}
      RETURNING id
    `;
    if (!updated[0]) continue;

    if (wasLeading) {
      const price = formatMoney(amount, item.currency);
      if (leader) {
        await tell(sql, leader, 'Vuelves a ser el mejor postor',
          `Se anularon pujas en "${item.title}". Tu puja de ${price} es otra vez la más alta.`, itemId);
      }
      await tell(sql, item.seller_id, 'Pujas anuladas en tu subasta',
        `Se anularon las pujas de una cuenta suspendida en "${item.title}". ${leader ? `La puja actual es ${price}.` : 'Ya no tiene pujas.'}`, itemId);
    }
    return;
  }
  throw new Error(`Could not reprice auction ${itemId}`);
}

// Returns how many auctions were changed.
export async function cancelRunningBids(sql, userId) {
  const cancelled = await sql`
    UPDATE bid_history b SET cancelled_at = now()
    FROM items i
    WHERE i.id = b.item_id AND b.bidder_id = ${userId} AND b.cancelled_at IS NULL
      AND i.sale_type = 'auc' AND i.end_at > now()
    RETURNING b.item_id
  `;
  const removed = new Map();
  for (const row of cancelled) removed.set(row.item_id, (removed.get(row.item_id) || 0) + 1);

  // Also any they lead from before bids were recorded one by one.
  const led = await sql`
    SELECT id FROM items WHERE highest_bidder_id = ${userId} AND sale_type = 'auc' AND end_at > now()
  `;
  const ids = new Set([...removed.keys(), ...led.map((r) => r.id)]);
  for (const itemId of ids) await repriceAuction(sql, itemId, userId, removed.get(itemId) || 0);
  return ids.size;
}

// For the two places an admin suspends someone. The suspension has already
// happened, so a failure here is reported rather than thrown.
export async function afterSuspension(sql, userId) {
  try {
    return { auctionsAffected: await cancelRunningBids(sql, userId), bidCancelFailed: false };
  } catch (err) {
    console.error('Cancelling bids failed (has sql/028 been run?):', err.message);
    return { auctionsAffected: 0, bidCancelFailed: true };
  }
}
