import { getSql } from '../_lib/db.js';
import { getRequestingAdmin } from '../_lib/admin.js';

// Revenue that's captured and NOT later given back — excludes pending_payment
// (never paid), cancelled (never paid), and refunded (paid then reversed).
// Used everywhere "revenue" is reported, so top-seller/item/buyer figures
// agree with the net revenue headline instead of quietly including refunds.
const NET_STATUSES = ['escrow_held', 'shipped', 'awaiting_confirmation', 'claim_pending', 'completed'];

const toRows = (rows) => rows.map((r) => ({ ...r, revenue: Number(r.revenue), orders: Number(r.orders) }));

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await getRequestingAdmin(req);
  if (!admin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const sql = getSql();

  const [
    statusCounts,
    revenueByCurrency,
    refundedByCurrency,
    topItems,
    topSellers,
    topBuyers,
    userCount,
    itemStats,
    dailyOrders,
  ] = await Promise.all([
    sql`SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status`,
    sql`
      SELECT currency, SUM(amount + shipping_cost) AS revenue, COUNT(*)::int AS orders
      FROM orders WHERE status = ANY(${NET_STATUSES}) GROUP BY currency
    `,
    sql`
      SELECT currency, SUM(amount + shipping_cost) AS revenue, COUNT(*)::int AS orders
      FROM orders WHERE status = 'refunded' GROUP BY currency
    `,
    sql`
      SELECT item_id, item_title, currency, SUM(amount + shipping_cost) AS revenue, COUNT(*)::int AS orders
      FROM orders WHERE status = ANY(${NET_STATUSES})
      GROUP BY item_id, item_title, currency ORDER BY revenue DESC LIMIT 10
    `,
    sql`
      SELECT seller_id, currency, SUM(amount + shipping_cost) AS revenue, COUNT(*)::int AS orders
      FROM orders WHERE status = ANY(${NET_STATUSES})
      GROUP BY seller_id, currency ORDER BY revenue DESC LIMIT 10
    `,
    sql`
      SELECT buyer_id, currency, SUM(amount + shipping_cost) AS revenue, COUNT(*)::int AS orders
      FROM orders WHERE status = ANY(${NET_STATUSES})
      GROUP BY buyer_id, currency ORDER BY revenue DESC LIMIT 10
    `,
    sql`SELECT COUNT(*)::int AS count FROM users WHERE is_admin = FALSE`,
    sql`
      SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE sale_type = 'auc' AND end_at > now())::int AS active_auctions
      FROM items
    `,
    sql`
      SELECT to_char(purchased_at, 'YYYY-MM-DD') AS day, COUNT(*)::int AS orders
      FROM orders WHERE purchased_at > now() - interval '30 days'
      GROUP BY day ORDER BY day
    `,
  ]);

  const sellerIds = topSellers.map((r) => r.seller_id);
  const buyerIds = topBuyers.map((r) => r.buyer_id);
  const itemSellerIds = topItems.length ? await sql`SELECT id, seller_id FROM items WHERE id = ANY(${topItems.map((r) => r.item_id)})` : [];
  const nameLookupIds = [...new Set([...sellerIds, ...buyerIds, ...itemSellerIds.map((r) => r.seller_id)])];
  const nameRows = nameLookupIds.length ? await sql`SELECT id, profile_name FROM users WHERE id = ANY(${nameLookupIds})` : [];
  const nameById = new Map(nameRows.map((u) => [String(u.id), u.profile_name]));
  const itemSellerById = new Map(itemSellerIds.map((r) => [r.id, r.seller_id]));

  return res.status(200).json({
    statusCounts: Object.fromEntries(statusCounts.map((r) => [r.status, r.count])),
    revenueByCurrency: toRows(revenueByCurrency),
    refundedByCurrency: toRows(refundedByCurrency),
    topItems: toRows(topItems).map((r) => ({
      itemId: r.item_id,
      itemTitle: r.item_title,
      sellerName: nameById.get(itemSellerById.get(r.item_id)) || 'N/A',
      currency: r.currency,
      revenue: r.revenue,
      orders: r.orders,
    })),
    topSellers: toRows(topSellers).map((r) => ({
      sellerId: r.seller_id,
      sellerName: nameById.get(r.seller_id) || r.seller_id,
      currency: r.currency,
      revenue: r.revenue,
      orders: r.orders,
    })),
    topBuyers: toRows(topBuyers).map((r) => ({
      buyerId: r.buyer_id,
      buyerName: nameById.get(r.buyer_id) || r.buyer_id,
      currency: r.currency,
      revenue: r.revenue,
      orders: r.orders,
    })),
    totalUsers: userCount[0].count,
    totalItems: itemStats[0].total,
    activeAuctions: itemStats[0].active_auctions,
    dailyOrders: dailyOrders.map((r) => ({ day: r.day, orders: Number(r.orders) })),
  });
}
