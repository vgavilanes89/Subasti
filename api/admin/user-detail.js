import { getSql } from '../_lib/db.js';
import { getRequestingAdmin } from '../_lib/admin.js';
import { toPublicUser } from '../_lib/users.js';
import { toPublicOrder } from '../_lib/orders.js';
import { toPublicItem } from '../_lib/items.js';

const NET_STATUSES = ['escrow_held', 'shipped', 'awaiting_confirmation', 'claim_pending', 'completed'];

const sumByCurrency = (rows) => {
  const sums = {};
  for (const r of rows) {
    const amt = Number(r.amount) + Number(r.shipping_cost || 0);
    sums[r.currency] = (sums[r.currency] || 0) + amt;
  }
  return sums;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await getRequestingAdmin(req);
  if (!admin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }

  const sql = getSql();
  const userRows = await sql`SELECT * FROM users WHERE id = ${id}`;
  if (!userRows[0]) {
    return res.status(404).json({ error: 'User not found' });
  }

  const [
    buyerOrderRows,
    sellerOrderRows,
    listedItemRows,
    bidRows,
    favoriteRows,
  ] = await Promise.all([
    sql`SELECT * FROM orders WHERE buyer_id = ${id} ORDER BY purchased_at DESC`,
    sql`SELECT * FROM orders WHERE seller_id = ${id} ORDER BY purchased_at DESC`,
    sql`SELECT * FROM items WHERE seller_id = ${id} ORDER BY created_at DESC`,
    sql`
      SELECT bh.id, bh.item_id, bh.amount, bh.placed_at,
        i.title AS item_title, i.currency, i.current_bid, i.highest_bidder_id, i.end_at
      FROM bid_history bh JOIN items i ON i.id = bh.item_id
      WHERE bh.bidder_id = ${id} ORDER BY bh.placed_at DESC
    `,
    sql`
      SELECT f.item_id, f.created_at, i.title AS item_title, i.currency, i.price,
        i.current_bid, i.sale_type, i.end_at
      FROM favorites f JOIN items i ON i.id = f.item_id
      WHERE f.user_id = ${id} ORDER BY f.created_at DESC
    `,
  ]);

  const counterpartyIds = [...new Set([
    ...buyerOrderRows.map((o) => o.seller_id),
    ...sellerOrderRows.map((o) => o.buyer_id),
  ])];
  const nameRows = counterpartyIds.length
    ? await sql`SELECT id, profile_name FROM users WHERE id = ANY(${counterpartyIds})`
    : [];
  const nameById = new Map(nameRows.map((u) => [String(u.id), u.profile_name]));

  const buyerOrders = buyerOrderRows.map((row) => {
    const order = toPublicOrder(row);
    return { ...order, counterpartyName: nameById.get(order.sellerId) || order.sellerId };
  });
  const sellerOrders = sellerOrderRows.map((row) => {
    const order = toPublicOrder(row);
    return { ...order, counterpartyName: nameById.get(order.buyerId) || order.buyerId };
  });

  const now = Date.now();
  const bids = bidRows.map((r) => ({
    id: r.id,
    itemId: r.item_id,
    itemTitle: r.item_title,
    currency: r.currency,
    amount: Number(r.amount),
    placedAt: new Date(r.placed_at).getTime(),
    isWinning: r.highest_bidder_id === id && (!r.end_at || new Date(r.end_at).getTime() > now),
  }));

  const favorites = favoriteRows.map((r) => ({
    itemId: r.item_id,
    itemTitle: r.item_title,
    currency: r.currency,
    price: Number(r.price),
    currentBid: r.current_bid === null ? null : Number(r.current_bid),
    saleType: r.sale_type,
    endAt: r.end_at ? new Date(r.end_at).getTime() : null,
    addedAt: new Date(r.created_at).getTime(),
  }));

  const spentByCurrency = sumByCurrency(buyerOrderRows.filter((o) => NET_STATUSES.includes(o.status)));
  const earnedByCurrency = sumByCurrency(sellerOrderRows.filter((o) => o.status === 'completed'));
  const wonAuctions = buyerOrderRows.filter((o) => o.order_type === 'auction_won').length;

  return res.status(200).json({
    profile: toPublicUser(userRows[0]),
    stats: {
      spentByCurrency,
      earnedByCurrency,
      ordersAsBuyer: buyerOrderRows.length,
      ordersAsSeller: sellerOrderRows.length,
      itemsListed: listedItemRows.length,
      activeListings: listedItemRows.filter((i) => i.sale_type !== 'auc' || !i.end_at || new Date(i.end_at).getTime() > now).length,
      bidsPlaced: bids.length,
      auctionsWon: wonAuctions,
      favoritesCount: favorites.length,
    },
    buyerOrders,
    sellerOrders,
    listedItems: listedItemRows.map(toPublicItem),
    bids,
    favorites,
  });
}
