// Rules shared by creating, editing and removing a listing.
import { del } from '@vercel/blob';
import { sanitizeAttributes, parsePaymentMethods } from './items.js';
import { ORDER_STATUS } from '../../src/data/escrow.js';

export const DAY_MS = 24 * 60 * 60 * 1000;
export const AUCTION_DAYS = [1, 3, 7, 15, 21];
const MAX_IMAGES = 5;
// Images are uploaded to Blob storage client-side (see src/api/upload.js)
// before the server ever sees them, so it should only receive short URLs —
// never raw base64.
const MAX_IMAGE_URL_CHARS = 2048;
const IMAGE_URL_PATTERN = /^https?:\/\//i;

const positive = (value) => {
  const n = Number(value);
  return value && Number.isFinite(n) && n > 0 ? n : null;
};

// The fields a seller types into the Sell form, cleaned. Returns { error } or { value }.
export function parseListingInput(body) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const category = typeof body.category === 'string' ? body.category : '';
  const subCategory = typeof body.subCategory === 'string' && body.subCategory ? body.subCategory : null;
  const condition = body.condition === 'used' ? 'used' : 'new';
  // SellPage's form state calls this field usedConditionDetail; the catalog
  // (and every reader of it) calls it conditionDetail.
  const conditionDetail = condition === 'used' && typeof body.usedConditionDetail === 'string'
    ? body.usedConditionDetail.trim() || null
    : null;
  const currency = body.currency === 'USD' ? 'USD' : 'CRC';
  const price = Number(body.price);
  const images = Array.isArray(body.images)
    ? body.images.filter((u) => typeof u === 'string' && u.length <= MAX_IMAGE_URL_CHARS && IMAGE_URL_PATTERN.test(u))
    : [];
  const shippingShip = Boolean(body.shippingShip);
  const shippingLocal = Boolean(body.shippingLocal);
  const shippingCost = shippingShip ? Number(body.shippingCost) || 0 : 0;
  const attributes = sanitizeAttributes(body.attributes);
  const paymentMethods = parsePaymentMethods(body.paymentMethods);
  const quantity = positive(body.quantity) ? Math.max(1, Math.floor(Number(body.quantity))) : 1;

  if (!title || title.length < 10) return { error: 'INVALID_TITLE' };
  if (!category) return { error: 'INVALID_CATEGORY' };
  if (!Number.isFinite(price) || price <= 0) return { error: 'INVALID_PRICE' };
  if (!paymentMethods) return { error: 'PAYMENT_METHOD_REQUIRED' };
  if (images.length === 0) return { error: 'IMAGES_REQUIRED' };
  if (images.length > MAX_IMAGES) return { error: 'TOO_MANY_IMAGES' };

  return {
    value: {
      title, description, category, subCategory, condition, conditionDetail, currency, price, images,
      shippingShip, shippingLocal, shippingCost, attributes, paymentMethods, quantity,
      reservePrice: positive(body.reservePrice),
      buyNowPrice: positive(body.buyNowPrice),
    },
  };
}

// Orders in these states no longer count as a sale.
const FELL_THROUGH = [ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED];

// What a seller may do with a listing right now. Each value is null (allowed)
// or the reason it isn't. `row` is the items row; `orders` the orders for it.
export function listingState(row, { orders = [], pendingOffer = false, now = Date.now() } = {}) {
  const locked = (reason) => ({ editBlocked: reason, removeBlocked: reason });
  if (pendingOffer) return locked('OFFER_PENDING');

  const sold = orders.some((o) => !FELL_THROUGH.includes(o.status));
  if (row.sale_type !== 'auc') return { editBlocked: null, removeBlocked: null };

  const ended = Boolean(row.end_at) && new Date(row.end_at).getTime() < now;
  const hasBids = Number(row.bids) > 0;
  // People have committed to this price and this description.
  if (hasBids && !ended) return locked('HAS_BIDS');

  const boughtOutright = orders.some((o) => o.order_type === 'buy_now');
  const reserveMet = row.reserve_price === null || row.reserve_price === undefined
    || Number(row.current_bid) >= Number(row.reserve_price);
  // The winner's order is only created when they come to pay.
  if (hasBids && row.highest_bidder_id && reserveMet && !boughtOutright && orders.length === 0) {
    return locked('HAS_WINNER');
  }
  if (sold) return { editBlocked: 'SOLD', removeBlocked: null };
  if (hasBids) return { editBlocked: 'HAS_BIDS', removeBlocked: null };
  return { editBlocked: null, removeBlocked: null };
}

// The orders and open second-chance offers behind a set of listings.
export async function loadListingRefs(sql, itemIds) {
  if (itemIds.length === 0) return { ordersFor: () => [], hasPendingOffer: () => false };
  const orders = await sql`SELECT item_id, status, order_type FROM orders WHERE item_id = ANY(${itemIds})`;
  const offers = await sql`
    SELECT item_id FROM second_chance_offers
    WHERE item_id = ANY(${itemIds}) AND status = 'pending' AND expires_at > now()
  `.catch(() => []);
  const withOffer = new Set(offers.map((o) => o.item_id));
  return {
    ordersFor: (id) => orders.filter((o) => o.item_id === id),
    hasPendingOffer: (id) => withOffer.has(id),
  };
}

// Frees storage for photos nothing shows any more. A photo's address comes
// from the client, so check it isn't also another listing's, an order's or
// someone's profile picture before deleting it.
export async function deleteUnusedImages(sql, urls) {
  const candidates = [...new Set(urls)].filter(
    (u) => typeof u === 'string' && u.includes('.blob.vercel-storage.com'),
  );
  const unused = [];
  try {
    for (const url of candidates) {
      const used = await sql`
        SELECT 1 FROM items WHERE image = ${url} OR images @> ${JSON.stringify([url])}::jsonb
        UNION ALL SELECT 1 FROM orders WHERE image = ${url}
        UNION ALL SELECT 1 FROM users WHERE avatar_url = ${url}
        LIMIT 1
      `;
      if (!used[0]) unused.push(url);
    }
    if (unused.length > 0) await del(unused);
  } catch (err) {
    console.error('Failed to delete unused image(s):', err.message);
  }
}
