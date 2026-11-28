import { randomUUID } from 'crypto';
import { getSql } from './_lib/db.js';
import { getUserIdFromRequest } from './_lib/session.js';
import { getRequestingAdmin } from './_lib/admin.js';
import { createNotification, getUserContact } from './_lib/notify.js';
import { isReviewable, reviewClosesAt, REVIEW_WINDOW_DAYS } from '../src/data/reviewRules.js';

// Buyers and sellers review each other, once per order each, after the sale is
// settled. Neither review is shown until both are written or the window ends.
// Buyers' reviews of sellers are in `reviews`, sellers' of buyers in
// `buyer_reviews`.
//
//   GET  ?sellerId=ID                    reviews of someone as a seller (public)
//   GET  ?buyerId=ID                     reviews of someone as a buyer (public)
//   GET  ?buyerIds=ID,ID                 just the buyer ratings, for a sales list
//   GET  ?mine=1                         what I've written and who's waiting on me
//   POST {orderId, rating, comment}      either side of a settled order
//   POST {action:'remove', reviewId}     admin
const MAX_COMMENT = 500;
const LIST_LIMIT = 100;
const MAX_BATCH = 200;
// The table or a column from sql/025 or sql/026 isn't there yet.
const NOT_MIGRATED = ['42P01', '42703'];
const EMPTY = { count: 0, average: 0, reviews: [] };

const toReview = (r) => ({
  id: r.id,
  rating: r.rating,
  comment: r.comment,
  itemTitle: r.item_title || '',
  from: r.profile_name || null,
  createdAt: new Date(r.created_at).getTime(),
});

// Visible = not removed, and either published or past the window.
async function reviewsOfSeller(sql, sellerId) {
  const rows = await sql`
    SELECT r.id, r.rating, r.comment, r.item_title, r.created_at, u.profile_name,
           COUNT(*) OVER ()::int AS total, AVG(r.rating) OVER ()::float AS average
    FROM reviews r
    LEFT JOIN orders o ON o.id = r.order_id
    LEFT JOIN users u ON u.id::text = r.reviewer_id
    WHERE r.seller_id = ${sellerId} AND r.removed_at IS NULL
      AND (r.published_at IS NOT NULL OR COALESCE(o.funds_released_at, o.refunded_at, o.purchased_at, r.created_at)
           < now() - (${REVIEW_WINDOW_DAYS} * interval '1 day'))
    ORDER BY r.created_at DESC
    LIMIT ${LIST_LIMIT}
  `;
  return rows.length ? { count: rows[0].total, average: rows[0].average, reviews: rows.map(toReview) } : EMPTY;
}

// No item title here: it would publish what someone has bought.
async function reviewsOfBuyer(sql, buyerId) {
  const rows = await sql`
    SELECT b.id, b.rating, b.comment, b.created_at, u.profile_name,
           COUNT(*) OVER ()::int AS total, AVG(b.rating) OVER ()::float AS average
    FROM buyer_reviews b
    LEFT JOIN orders o ON o.id = b.order_id
    LEFT JOIN users u ON u.id::text = b.seller_id
    WHERE b.buyer_id = ${buyerId} AND b.removed_at IS NULL
      AND (b.published_at IS NOT NULL OR COALESCE(o.funds_released_at, o.refunded_at, o.purchased_at, b.created_at)
           < now() - (${REVIEW_WINDOW_DAYS} * interval '1 day'))
    ORDER BY b.created_at DESC
    LIMIT ${LIST_LIMIT}
  `;
  return rows.length ? { count: rows[0].total, average: rows[0].average, reviews: rows.map(toReview) } : EMPTY;
}

async function buyerRatings(sql, buyerIds) {
  const rows = await sql`
    SELECT b.buyer_id, COUNT(*)::int AS count, AVG(b.rating)::float AS average
    FROM buyer_reviews b
    LEFT JOIN orders o ON o.id = b.order_id
    WHERE b.buyer_id = ANY(${buyerIds}) AND b.removed_at IS NULL
      AND (b.published_at IS NOT NULL OR COALESCE(o.funds_released_at, o.refunded_at, o.purchased_at, b.created_at)
           < now() - (${REVIEW_WINDOW_DAYS} * interval '1 day'))
    GROUP BY b.buyer_id
  `;
  return Object.fromEntries(rows.map((r) => [r.buyer_id, { count: r.count, average: r.average }]));
}

async function myReviews(sql, userId) {
  const written = await sql`
    SELECT order_id, published_at FROM reviews WHERE reviewer_id = ${userId}
    UNION ALL
    SELECT order_id, published_at FROM buyer_reviews WHERE seller_id = ${userId}
  `;
  // Orders where the other side has written and I haven't. Never what they wrote.
  const waiting = await sql`
    SELECT b.order_id FROM buyer_reviews b
    WHERE b.buyer_id = ${userId} AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.order_id = b.order_id)
    UNION ALL
    SELECT r.order_id FROM reviews r
    WHERE r.seller_id = ${userId} AND NOT EXISTS (SELECT 1 FROM buyer_reviews b WHERE b.order_id = r.order_id)
  `;
  return {
    available: true,
    written: Object.fromEntries(written.map((r) => [r.order_id, { published: Boolean(r.published_at) }])),
    waiting: waiting.map((r) => r.order_id),
  };
}

const notify = async (sql, userId, title, body, link) => {
  try {
    const contact = await getUserContact(sql, userId);
    await createNotification({ sql, userId, type: 'order_status', title, body, link, email: contact?.email, name: contact?.name });
  } catch (err) {
    console.error('Review notification failed:', err.message);
  }
};

export default async function handler(req, res) {
  const sql = getSql();
  try {
    if (req.method === 'GET') {
      if (req.query.mine) {
        const userId = getUserIdFromRequest(req);
        if (!userId) return res.status(401).json({ error: 'Not authenticated' });
        return res.status(200).json(await myReviews(sql, userId));
      }
      const { sellerId, buyerId, buyerIds } = req.query;
      if (typeof buyerIds === 'string') {
        const ids = buyerIds.split(',').filter(Boolean).slice(0, MAX_BATCH);
        return res.status(200).json({ ratings: ids.length ? await buyerRatings(sql, ids) : {} });
      }
      if (typeof buyerId === 'string' && buyerId) return res.status(200).json(await reviewsOfBuyer(sql, buyerId));
      if (typeof sellerId === 'string' && sellerId) return res.status(200).json(await reviewsOfSeller(sql, sellerId));
      return res.status(400).json({ error: 'sellerId or buyerId is required' });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = typeof req.body === 'object' && req.body ? req.body : {};

    if (body.action === 'remove') {
      if (!(await getRequestingAdmin(req))) return res.status(403).json({ error: 'Forbidden' });
      const reviewId = typeof body.reviewId === 'string' ? body.reviewId : '';
      const removed = reviewId.startsWith('brev_')
        ? await sql`UPDATE buyer_reviews SET removed_at = now() WHERE id = ${reviewId} AND removed_at IS NULL RETURNING id`
        : await sql`UPDATE reviews SET removed_at = now() WHERE id = ${reviewId} AND removed_at IS NULL RETURNING id`;
      if (!removed[0]) return res.status(404).json({ error: 'Review not found' });
      return res.status(200).json({ id: reviewId });
    }

    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const orderId = typeof body.orderId === 'string' ? body.orderId : '';
    const rating = body.rating;
    const comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, MAX_COMMENT) : '';
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'INVALID_RATING' });
    }

    // Only the two sides of the order; anyone else is told it doesn't exist.
    const order = (await sql`SELECT * FROM orders WHERE id = ${orderId}`)[0];
    const asBuyer = order?.buyer_id === userId;
    if (!order || (!asBuyer && order.seller_id !== userId)) return res.status(404).json({ error: 'Order not found' });
    if (!isReviewable(order.status)) return res.status(409).json({ error: 'NOT_REVIEWABLE' });
    const ms = (value) => (value ? new Date(value).getTime() : null);
    const closesAt = reviewClosesAt({
      fundsReleasedAt: ms(order.funds_released_at), refundedAt: ms(order.refunded_at), purchasedAt: ms(order.purchased_at),
    });
    if (Date.now() > closesAt) return res.status(409).json({ error: 'REVIEW_CLOSED' });

    // Both tables must be ready, or a review could be stored that never shows.
    await sql`SELECT published_at FROM reviews LIMIT 0`;
    await sql`SELECT published_at FROM buyer_reviews LIMIT 0`;

    const id = `${asBuyer ? 'rev' : 'brev'}_${randomUUID()}`;
    const inserted = asBuyer
      ? await sql`
          INSERT INTO reviews (id, order_id, seller_id, reviewer_id, item_title, rating, comment)
          VALUES (${id}, ${orderId}, ${order.seller_id}, ${userId}, ${order.item_title || ''}, ${rating}, ${comment})
          ON CONFLICT (order_id) DO NOTHING RETURNING id`
      : await sql`
          INSERT INTO buyer_reviews (id, order_id, buyer_id, seller_id, rating, comment)
          VALUES (${id}, ${orderId}, ${order.buyer_id}, ${userId}, ${rating}, ${comment})
          ON CONFLICT (order_id) DO NOTHING RETURNING id`;
    if (!inserted[0]) return res.status(409).json({ error: 'ALREADY_REVIEWED' });

    // Checked after inserting, so if both sides post at once one of them still sees the other.
    const other = asBuyer
      ? await sql`SELECT 1 FROM buyer_reviews WHERE order_id = ${orderId}`
      : await sql`SELECT 1 FROM reviews WHERE order_id = ${orderId}`;
    const published = other.length > 0;
    const otherId = asBuyer ? order.seller_id : order.buyer_id;
    if (published) {
      await sql`UPDATE reviews SET published_at = now() WHERE order_id = ${orderId} AND published_at IS NULL`;
      await sql`UPDATE buyer_reviews SET published_at = now() WHERE order_id = ${orderId} AND published_at IS NULL`;
      await notify(sql, otherId, 'Las reseñas ya son visibles',
        `Ambos dejaron su reseña sobre "${order.item_title}".`, `/seller/${otherId}`);
    } else {
      // Says only that there is one: the rating stays hidden until they write theirs.
      await notify(sql, otherId, 'Te dejaron una reseña',
        `Hay una reseña sobre "${order.item_title}". Deja la tuya para verla; si no, aparecerá cuando se cierre el plazo de ${REVIEW_WINDOW_DAYS} días.`,
        asBuyer ? '/profile?tab=selling' : '/profile?tab=buying');
    }
    return res.status(201).json({ id, published });
  } catch (err) {
    // Before the migrations have run: pages show no reviews rather than break.
    if (NOT_MIGRATED.includes(err.code) && req.method === 'GET') {
      if (req.query.mine) return res.status(200).json({ available: false, written: {}, waiting: [] });
      return res.status(200).json(typeof req.query.buyerIds === 'string' ? { ratings: {} } : EMPTY);
    }
    console.error('Reviews request failed:', err.message);
    return res.status(500).json({ error: 'REQUEST_FAILED' });
  }
}
