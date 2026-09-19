import { getSql } from '../_lib/db.js';
import { getRequestingAdmin } from '../_lib/admin.js';
import { getCommissionRate } from '../_lib/settings.js';

// "Paid" = the buyer's payment was captured at some point, even if later
// refunded (used for GMV — gross value transacted).
const PAID_STATUSES = ['escrow_held', 'shipped', 'awaiting_confirmation', 'claim_pending', 'completed', 'refunded'];
// "Net" additionally excludes orders later refunded back to the buyer.
const NET_STATUSES = ['escrow_held', 'shipped', 'awaiting_confirmation', 'claim_pending', 'completed'];
const CHURN_MS = 60 * 24 * 60 * 60 * 1000; // a seller with no active listing and no sale in 60 days is "churned"
const DAY_MS = 24 * 60 * 60 * 1000;

const PERIOD_DAYS = { '7d': 7, '30d': 30, '90d': 90, all: null };

const toNum = (v) => Number(v) || 0;
const groupMoney = (rows, amountKey = 'total') => rows.map((r) => ({ currency: r.currency, amount: toNum(r[amountKey]), orders: r.orders !== undefined ? Number(r.orders) : undefined }));

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await getRequestingAdmin(req);
  if (!admin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const period = ['7d', '30d', '90d', 'all'].includes(req.query.period) ? req.query.period : '30d';
  const periodDays = PERIOD_DAYS[period];
  const now = Date.now();
  const periodStart = new Date(periodDays ? now - periodDays * DAY_MS : 0);
  const dayAgo = new Date(now - DAY_MS);
  const monthAgo = new Date(now - 30 * DAY_MS);

  const sql = getSql();

  const [
    commissionRate,
    statusCounts,
    gmvRows,
    refundRows,
    payoutRows,
    topItems,
    topSellers,
    topBuyers,
    dailyOrders,
    dauRows,
    mauRows,
    buyerFirstOrders,
    periodBuyers,
    sellerListingStats,
    sellerSaleStats,
    buyerCountRows,
    sellerCountRows,
    listingCounts,
    disputeRows,
    periodOrderCount,
    itemViewCount,
    topSearches,
    topZeroResultSearches,
  ] = await Promise.all([
    getCommissionRate(sql),
    sql`SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status`,
    sql`
      SELECT currency, SUM(amount) AS total, COUNT(*)::int AS orders
      FROM orders WHERE status = ANY(${PAID_STATUSES}) AND purchased_at >= ${periodStart}
      GROUP BY currency
    `,
    sql`
      SELECT currency, SUM(amount + shipping_cost) AS total, COUNT(*)::int AS orders
      FROM orders WHERE status = 'refunded' AND refunded_at >= ${periodStart}
      GROUP BY currency
    `,
    sql`
      SELECT currency, SUM(amount) AS total FROM payouts WHERE paid_out_at >= ${periodStart} GROUP BY currency
    `,
    sql`
      SELECT item_id, item_title, currency, SUM(amount + shipping_cost) AS revenue, COUNT(*)::int AS orders
      FROM orders WHERE status = ANY(${NET_STATUSES}) AND purchased_at >= ${periodStart}
      GROUP BY item_id, item_title, currency ORDER BY revenue DESC LIMIT 10
    `,
    sql`
      SELECT seller_id, currency, SUM(amount + shipping_cost) AS revenue, COUNT(*)::int AS orders
      FROM orders WHERE status = ANY(${NET_STATUSES}) AND purchased_at >= ${periodStart}
      GROUP BY seller_id, currency ORDER BY revenue DESC LIMIT 10
    `,
    sql`
      SELECT buyer_id, currency, SUM(amount + shipping_cost) AS revenue, COUNT(*)::int AS orders
      FROM orders WHERE status = ANY(${NET_STATUSES}) AND purchased_at >= ${periodStart}
      GROUP BY buyer_id, currency ORDER BY revenue DESC LIMIT 10
    `,
    sql`
      SELECT to_char(purchased_at, 'YYYY-MM-DD') AS day, COUNT(*)::int AS orders
      FROM orders WHERE purchased_at >= ${periodStart}
      GROUP BY day ORDER BY day
    `,
    sql`SELECT COUNT(DISTINCT user_id)::int AS count FROM login_events WHERE logged_in_at >= ${dayAgo}`,
    sql`SELECT COUNT(DISTINCT user_id)::int AS count FROM login_events WHERE logged_in_at >= ${monthAgo}`,
    sql`SELECT buyer_id, MIN(purchased_at) AS first_order FROM orders GROUP BY buyer_id`,
    sql`SELECT DISTINCT buyer_id FROM orders WHERE purchased_at >= ${periodStart}`,
    sql`
      SELECT seller_id, MIN(created_at) AS first_listing,
        BOOL_OR((sale_type = 'buy' AND quantity > 0) OR (sale_type = 'auc' AND end_at > now())) AS has_active
      FROM items GROUP BY seller_id
    `,
    sql`SELECT seller_id, MAX(purchased_at) AS last_sale FROM orders GROUP BY seller_id`,
    sql`SELECT COUNT(DISTINCT buyer_id)::int AS count FROM orders`,
    sql`SELECT COUNT(DISTINCT seller_id)::int AS count FROM items`,
    sql`
      SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE (sale_type = 'buy' AND quantity > 0) OR (sale_type = 'auc' AND end_at > now()))::int AS active,
        COUNT(*) FILTER (WHERE sale_type = 'buy' AND quantity <= 0)::int AS out_of_stock
      FROM items
    `,
    sql`
      SELECT COUNT(*) FILTER (WHERE claim_filed_at >= ${periodStart})::int AS disputed,
        COUNT(*) FILTER (WHERE purchased_at >= ${periodStart})::int AS total
      FROM orders
    `,
    sql`SELECT COUNT(*)::int AS count FROM orders WHERE status = ANY(${PAID_STATUSES}) AND purchased_at >= ${periodStart}`,
    sql`SELECT COUNT(*)::int AS count FROM item_view_events WHERE created_at >= ${periodStart}`,
    sql`
      SELECT lower(trim(query)) AS term, COUNT(*)::int AS count
      FROM search_events WHERE created_at >= ${periodStart}
      GROUP BY term ORDER BY count DESC LIMIT 10
    `,
    sql`
      SELECT lower(trim(query)) AS term, COUNT(*)::int AS count
      FROM search_events WHERE created_at >= ${periodStart} AND result_count = 0
      GROUP BY term ORDER BY count DESC LIMIT 10
    `,
  ]);

  // --- Financial ---
  const gmvByCurrency = groupMoney(gmvRows);
  const platformRevenueByCurrency = gmvByCurrency.map((r) => ({ currency: r.currency, amount: r.amount * (commissionRate / 100) }));
  const aovByCurrency = gmvByCurrency.map((r) => ({ currency: r.currency, amount: r.orders ? r.amount / r.orders : 0 }));
  const refundsByCurrency = groupMoney(refundRows);
  const payoutsByCurrency = groupMoney(payoutRows);

  // --- Growth ---
  const firstOrderByBuyer = new Map(buyerFirstOrders.map((r) => [r.buyer_id, new Date(r.first_order).getTime()]));
  let newBuyers = 0;
  let returningBuyers = 0;
  for (const { buyer_id: buyerId } of periodBuyers) {
    const first = firstOrderByBuyer.get(buyerId);
    if (first !== undefined && first >= periodStart.getTime()) newBuyers += 1;
    else returningBuyers += 1;
  }

  const lastSaleBySeller = new Map(sellerSaleStats.map((r) => [r.seller_id, r.last_sale ? new Date(r.last_sale).getTime() : null]));
  let newSellers = 0;
  let activeSellers = 0;
  let churnedSellers = 0;
  for (const row of sellerListingStats) {
    const firstListing = new Date(row.first_listing).getTime();
    if (firstListing >= periodStart.getTime()) newSellers += 1;
    if (row.has_active) {
      activeSellers += 1;
    } else {
      const lastSale = lastSaleBySeller.get(row.seller_id);
      if (!lastSale || now - lastSale > CHURN_MS) churnedSellers += 1;
    }
  }
  const totalSellers = sellerListingStats.length;
  const buyerCount = buyerCountRows[0].count;
  const sellerCount = sellerCountRows[0].count;

  // --- Liquidity & Operations ---
  const views = itemViewCount[0].count;
  const conversions = periodOrderCount[0].count;
  const conversionRate = views > 0 ? (conversions / views) * 100 : 0;
  const disputeRate = disputeRows[0].total > 0 ? (disputeRows[0].disputed / disputeRows[0].total) * 100 : 0;

  // Name resolution for the top-N tables.
  const itemSellerIds = topItems.length ? await sql`SELECT id, seller_id FROM items WHERE id = ANY(${topItems.map((r) => r.item_id)})` : [];
  const itemSellerById = new Map(itemSellerIds.map((r) => [r.id, r.seller_id]));
  const nameLookupIds = [...new Set([
    ...topSellers.map((r) => r.seller_id),
    ...topBuyers.map((r) => r.buyer_id),
    ...itemSellerIds.map((r) => r.seller_id),
  ])];
  const nameRows = nameLookupIds.length ? await sql`SELECT id, profile_name FROM users WHERE id = ANY(${nameLookupIds})` : [];
  const nameById = new Map(nameRows.map((u) => [String(u.id), u.profile_name]));

  return res.status(200).json({
    period,
    financial: {
      commissionRate,
      gmvByCurrency,
      platformRevenueByCurrency,
      aovByCurrency,
      refundsByCurrency,
      payoutsByCurrency,
    },
    growth: {
      dau: dauRows[0].count,
      mau: mauRows[0].count,
      newBuyers,
      returningBuyers,
      newSellers,
      activeSellers,
      churnedSellers,
      totalSellers,
      buyerCount,
      sellerCount,
      buyerToSellerRatio: sellerCount > 0 ? buyerCount / sellerCount : null,
    },
    liquidity: {
      conversionRate,
      views,
      conversions,
      totalListings: listingCounts[0].total,
      activeListings: listingCounts[0].active,
      outOfStock: listingCounts[0].out_of_stock,
      disputeRate,
      disputedOrders: disputeRows[0].disputed,
      totalOrdersInPeriod: disputeRows[0].total,
      topSearches: topSearches.map((r) => ({ term: r.term, count: r.count })),
      topZeroResultSearches: topZeroResultSearches.map((r) => ({ term: r.term, count: r.count })),
    },
    statusCounts: Object.fromEntries(statusCounts.map((r) => [r.status, r.count])),
    topItems: topItems.map((r) => ({
      itemId: r.item_id, itemTitle: r.item_title,
      sellerName: nameById.get(itemSellerById.get(r.item_id)) || 'N/A',
      currency: r.currency, revenue: toNum(r.revenue), orders: r.orders,
    })),
    topSellers: topSellers.map((r) => ({
      sellerId: r.seller_id, sellerName: nameById.get(r.seller_id) || r.seller_id,
      currency: r.currency, revenue: toNum(r.revenue), orders: r.orders,
    })),
    topBuyers: topBuyers.map((r) => ({
      buyerId: r.buyer_id, buyerName: nameById.get(r.buyer_id) || r.buyer_id,
      currency: r.currency, revenue: toNum(r.revenue), orders: r.orders,
    })),
    dailyOrders: dailyOrders.map((r) => ({ day: r.day, orders: Number(r.orders) })),
  });
}
