import { randomUUID } from 'crypto';
import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';
import { toPublicItem } from '../_lib/items.js';
import { getBidIncrement, ANTI_SNIPE_WINDOW_MS, ANTI_SNIPE_EXTENSION_MS } from '../../src/lib/bidding.js';

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
  const itemId = typeof body.itemId === 'string' ? body.itemId : '';
  const amount = Number(body.amount);

  const sql = getSql();
  const rows = await sql`SELECT * FROM items WHERE id = ${itemId}`;
  const row = rows[0];
  if (!row || row.sale_type !== 'auc') {
    return res.status(400).json({ error: 'INVALID_AUCTION' });
  }
  if (row.end_at && new Date(row.end_at).getTime() < Date.now()) {
    return res.status(400).json({ error: 'AUCTION_ENDED' });
  }
  if (row.seller_id === userId) {
    return res.status(400).json({ error: 'OWN_ITEM' });
  }
  if (!Number.isFinite(amount)) {
    return res.status(400).json({ error: 'INVALID_AMOUNT' });
  }

  const previousBid = row.current_bid === null ? null : Number(row.current_bid);
  const currentBaseline = previousBid ?? Number(row.price);
  const minBid = currentBaseline + getBidIncrement(currentBaseline, row.currency);
  if (amount < minBid) {
    return res.status(400).json({ error: 'BID_TOO_LOW' });
  }

  // Anti-snipe / soft close: a bid inside the last minute pushes the end
  // time out by two minutes, so a last-second bid can't win purely by
  // leaving no time for a counter-bid.
  const previousEndAtMs = row.end_at ? new Date(row.end_at).getTime() : null;
  const newEndAt = previousEndAtMs !== null && previousEndAtMs - Date.now() <= ANTI_SNIPE_WINDOW_MS
    ? new Date(previousEndAtMs + ANTI_SNIPE_EXTENSION_MS)
    : row.end_at;

  // Compare-and-swap against the exact row we validated against — if another
  // bid landed in between, this affects 0 rows instead of silently
  // overwriting a bid that raced past our validation.
  const updated = await sql`
    UPDATE items SET current_bid = ${amount}, bids = bids + 1, highest_bidder_id = ${userId}, end_at = ${newEndAt}
    WHERE id = ${itemId} AND current_bid IS NOT DISTINCT FROM ${previousBid}
    RETURNING *
  `;
  if (!updated[0]) {
    return res.status(409).json({ error: 'BID_RACE_LOST' });
  }

  await sql`
    INSERT INTO bid_history (id, item_id, bidder_id, amount)
    VALUES (${`bid_${randomUUID()}`}, ${itemId}, ${userId}, ${amount})
  `;

  return res.status(200).json(toPublicItem(updated[0]));
}
