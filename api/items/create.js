import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';
import { toPublicItem, generateItemId } from '../_lib/items.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_IMAGES = 5;
// Images are stored inline as data URLs, no object storage behind this — and
// Vercel's serverless functions hard-reject request bodies over ~4.5MB
// (platform limit, not configurable) with an opaque, non-JSON 413. Capping
// well under that gives a clear, actionable error instead.
const MAX_TOTAL_IMAGE_CHARS = 4 * 1024 * 1024;

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
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const category = typeof body.category === 'string' ? body.category : '';
  const subCategory = typeof body.subCategory === 'string' ? body.subCategory : null;
  const saleType = body.saleType === 'auc' ? 'auc' : 'buy';
  const condition = body.condition === 'used' ? 'used' : 'new';
  // SellPage's form state calls this field usedConditionDetail; the catalog
  // (and every reader of it) calls it conditionDetail.
  const conditionDetail = condition === 'used' && typeof body.usedConditionDetail === 'string'
    ? body.usedConditionDetail.trim() || null
    : null;
  const currency = body.currency === 'USD' ? 'USD' : 'CRC';
  const price = Number(body.price);
  const images = Array.isArray(body.images) ? body.images.filter((u) => typeof u === 'string') : [];
  const shippingShip = Boolean(body.shippingShip);
  const shippingLocal = Boolean(body.shippingLocal);
  const shippingCost = shippingShip ? Number(body.shippingCost) || 0 : 0;

  if (!title || title.length < 10) return res.status(400).json({ error: 'INVALID_TITLE' });
  if (!category) return res.status(400).json({ error: 'INVALID_CATEGORY' });
  if (!Number.isFinite(price) || price <= 0) return res.status(400).json({ error: 'INVALID_PRICE' });
  if (images.length === 0) return res.status(400).json({ error: 'IMAGES_REQUIRED' });
  if (images.length > MAX_IMAGES) return res.status(400).json({ error: 'TOO_MANY_IMAGES' });
  if (images.reduce((sum, img) => sum + img.length, 0) > MAX_TOTAL_IMAGE_CHARS) {
    return res.status(400).json({ error: 'IMAGES_TOO_LARGE' });
  }

  let quantity = 1;
  let buyNowPrice = null;
  let reservePrice = null;
  let currentBid = null;
  let bids = 0;
  let endAt = null;

  if (saleType === 'buy') {
    quantity = Number.isFinite(Number(body.quantity)) && Number(body.quantity) > 0 ? Math.floor(Number(body.quantity)) : 1;
  } else {
    const durationDays = Number.isFinite(Number(body.auctionDuration)) ? Number(body.auctionDuration) : 7;
    endAt = new Date(Date.now() + durationDays * DAY_MS);
    currentBid = price;
    bids = 0;
    if (body.reservePrice) {
      const rp = Number(body.reservePrice);
      if (Number.isFinite(rp) && rp > 0) reservePrice = rp;
    }
    if (body.buyNowPrice) {
      const bnp = Number(body.buyNowPrice);
      if (Number.isFinite(bnp) && bnp > 0) buyNowPrice = bnp;
    }
  }

  const sql = getSql();
  const id = generateItemId();
  const rows = await sql`
    INSERT INTO items (
      id, title, description, category, sub_category, currency, price, image, images,
      sale_type, condition, condition_detail, seller_id, quantity,
      shipping_ship, shipping_local, shipping_cost, buy_now_price,
      current_bid, bids, reserve_price, end_at
    ) VALUES (
      ${id}, ${title}, ${description}, ${category}, ${subCategory}, ${currency}, ${price}, ${images[0]}, ${JSON.stringify(images)},
      ${saleType}, ${condition}, ${conditionDetail}, ${userId}, ${quantity},
      ${shippingShip}, ${shippingLocal}, ${shippingCost}, ${buyNowPrice},
      ${currentBid}, ${bids}, ${reservePrice}, ${endAt}
    )
    RETURNING *
  `;
  return res.status(201).json(toPublicItem(rows[0]));
}
