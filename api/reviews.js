import { randomUUID } from 'crypto';
import { getSql } from './_lib/db.js';
import { getUserIdFromRequest } from './_lib/session.js';
import { getRequestingAdmin } from './_lib/admin.js';
import { createNotification, getUserContact } from './_lib/notify.js';
import { ORDER_STATUS } from '../src/data/escrow.js';

// Buyers review sellers, once per order, after the sale has been settled.
//
//   GET  ?sellerId=ID                    a seller's reviews (public)
//   GET  ?mine=1                         which of my orders I've already reviewed
//   POST {orderId, rating, comment}      buyer of a completed or refunded order
//   POST {action:'remove', reviewId}     admin
const REVIEWABLE = [ORDER_STATUS.COMPLETED, ORDER_STATUS.REFUNDED];
const MAX_COMMENT = 500;
const LIST_LIMIT = 100;
const UNDEFINED_TABLE = '42P01';

export default async function handler(req, res) {
  const sql = getSql();
  try {
    if (req.method === 'GET') {
      if (req.query.mine) {
        const userId = getUserIdFromRequest(req);
        if (!userId) return res.status(401).json({ error: 'Not authenticated' });
        const rows = await sql`SELECT order_id FROM reviews WHERE reviewer_id = ${userId}`;
        return res.status(200).json({ available: true, orderIds: rows.map((r) => r.order_id) });
      }

      const sellerId = typeof req.query.sellerId === 'string' ? req.query.sellerId : '';
      if (!sellerId) return res.status(400).json({ error: 'sellerId is required' });
      const totals = (await sql`
        SELECT COUNT(*)::int AS count, COALESCE(AVG(rating), 0)::float AS average
        FROM reviews WHERE seller_id = ${sellerId}
      `)[0];
      const rows = await sql`
        SELECT r.id, r.rating, r.comment, r.item_title, r.created_at, u.profile_name
        FROM reviews r LEFT JOIN users u ON u.id::text = r.reviewer_id
        WHERE r.seller_id = ${sellerId}
        ORDER BY r.created_at DESC
        LIMIT ${LIST_LIMIT}
      `;
      return res.status(200).json({
        count: totals.count,
        average: totals.average,
        reviews: rows.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          itemTitle: r.item_title,
          from: r.profile_name || null,
          createdAt: new Date(r.created_at).getTime(),
        })),
      });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = typeof req.body === 'object' && req.body ? req.body : {};

    if (body.action === 'remove') {
      if (!(await getRequestingAdmin(req))) return res.status(403).json({ error: 'Forbidden' });
      const reviewId = typeof body.reviewId === 'string' ? body.reviewId : '';
      const removed = await sql`DELETE FROM reviews WHERE id = ${reviewId} RETURNING id`;
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

    // Only the buyer of that order; anyone else is told it doesn't exist.
    const order = (await sql`SELECT * FROM orders WHERE id = ${orderId}`)[0];
    if (!order || order.buyer_id !== userId) return res.status(404).json({ error: 'Order not found' });
    if (!REVIEWABLE.includes(order.status)) return res.status(409).json({ error: 'NOT_REVIEWABLE' });

    const inserted = await sql`
      INSERT INTO reviews (id, order_id, seller_id, reviewer_id, item_title, rating, comment)
      VALUES (${`rev_${randomUUID()}`}, ${orderId}, ${order.seller_id}, ${userId}, ${order.item_title || ''}, ${rating}, ${comment})
      ON CONFLICT (order_id) DO NOTHING
      RETURNING id
    `;
    if (!inserted[0]) return res.status(409).json({ error: 'ALREADY_REVIEWED' });

    try {
      const contact = await getUserContact(sql, order.seller_id);
      await createNotification({
        sql,
        userId: order.seller_id,
        type: 'order_status',
        title: `Nueva reseña: ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`,
        body: `Un comprador calificó la venta de "${order.item_title}".`,
        link: `/seller/${order.seller_id}`,
        email: contact?.email,
        name: contact?.name,
      });
    } catch (err) {
      console.error('Review notification failed:', err.message);
    }
    return res.status(201).json({ id: inserted[0].id });
  } catch (err) {
    // Before sql/025 has run there is no table: pages show no reviews rather than break.
    if (err.code === UNDEFINED_TABLE && req.method === 'GET') {
      return res.status(200).json(req.query.mine
        ? { available: false, orderIds: [] }
        : { count: 0, average: 0, reviews: [] });
    }
    console.error('Reviews request failed:', err.message);
    return res.status(500).json({ error: 'REQUEST_FAILED' });
  }
}
