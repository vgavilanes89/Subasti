import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';
import { toPublicItem } from '../_lib/items.js';

// Every auction the signed-in user has bid on, with their own highest bid
// next to the item's live state, so the buyer dashboard can show whether
// they are winning, were outbid, won or lost. Reads bid_history, plus
// items.highest_bidder_id so bids placed before bid_history existed still show.
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
  const rows = await sql`
    SELECT i.*, m.my_max, m.last_bid_at
    FROM items i
    LEFT JOIN (
      SELECT item_id, MAX(amount) AS my_max, MAX(placed_at) AS last_bid_at
      FROM bid_history
      WHERE bidder_id = ${userId}
      GROUP BY item_id
    ) m ON m.item_id = i.id
    WHERE i.sale_type = 'auc' AND (m.item_id IS NOT NULL OR i.highest_bidder_id = ${userId})
    ORDER BY COALESCE(m.last_bid_at, i.created_at) DESC
  `;

  return res.status(200).json(rows.map((row) => ({
    item: toPublicItem(row),
    myHighestBid: row.my_max !== null && row.my_max !== undefined
      ? Number(row.my_max)
      : Number(row.current_bid),
    lastBidAt: row.last_bid_at ? new Date(row.last_bid_at).getTime() : null,
  })));
}
