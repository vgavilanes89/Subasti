import { randomUUID } from 'crypto';

// The frontend does plain millisecond arithmetic on endAt (countdown timers,
// `item.endAt < now` checks), so it must come back as an epoch-ms number,
// not a Date/ISO string — same convention as toPublicOrder.
const toMs = (value) => (value ? new Date(value).getTime() : null);
const toNum = (value) => (value === null || value === undefined ? null : Number(value));

export function toPublicItem(row) {
  return {
    id: row.id,
    itemNumber: row.item_number,
    title: row.title,
    description: row.description,
    category: row.category,
    subCategory: row.sub_category,
    currency: row.currency,
    price: toNum(row.price),
    image: row.image,
    images: row.images || [],
    saleType: row.sale_type,
    condition: row.condition,
    conditionDetail: row.condition_detail,
    sellerId: row.seller_id,
    quantity: row.quantity,
    shippingShip: row.shipping_ship,
    shippingLocal: row.shipping_local,
    shippingCost: toNum(row.shipping_cost) || 0,
    buyNowPrice: toNum(row.buy_now_price),
    currentBid: toNum(row.current_bid),
    bids: row.bids,
    reservePrice: toNum(row.reserve_price),
    endAt: toMs(row.end_at),
    highestBidderId: row.highest_bidder_id,
    attributes: row.attributes || {},
  };
}

// Category-specific extra details (brand, model, size, etc. — see
// src/data/categoryAttributes.js) are free-form per listing, but still
// constrained here: plain string/number values only, capped in count and
// length, so a client can't smuggle in huge blobs or nested objects.
const MAX_ATTRIBUTES = 10;
const MAX_ATTRIBUTE_KEY_LENGTH = 50;
const MAX_ATTRIBUTE_VALUE_LENGTH = 200;

export function sanitizeAttributes(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const result = {};
  let count = 0;
  for (const [key, value] of Object.entries(raw)) {
    if (count >= MAX_ATTRIBUTES) break;
    if (typeof key !== 'string' || key.length === 0 || key.length > MAX_ATTRIBUTE_KEY_LENGTH) continue;
    if (typeof value !== 'string' && typeof value !== 'number') continue;
    const strValue = String(value).trim().slice(0, MAX_ATTRIBUTE_VALUE_LENGTH);
    if (!strValue) continue;
    result[key] = strValue;
    count += 1;
  }
  return result;
}

export async function getItemById(sql, id) {
  const rows = await sql`SELECT * FROM items WHERE id = ${id}`;
  return rows[0] ? toPublicItem(rows[0]) : null;
}

export function generateItemId() {
  return `item_${randomUUID()}`;
}

// Human-readable, distinct from the internal id — same style as users'
// account_number (SUB-########), retried on collision by the caller.
export function generateItemNumber() {
  const digits = Math.floor(10000000 + Math.random() * 90000000);
  return `ITM-${digits}`;
}
