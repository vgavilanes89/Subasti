import { randomUUID } from 'crypto';
import { normalizePaymentMethods, acceptedMethods } from '../../src/data/paymentMethods.js';

// The frontend does plain millisecond arithmetic on endAt (countdown timers,
// `item.endAt < now` checks), so it must come back as an epoch-ms number,
// not a Date/ISO string — same convention as toPublicOrder.
const toMs = (value) => (value ? new Date(value).getTime() : null);
const toNum = (value) => (value === null || value === undefined ? null : Number(value));

// The reserve price is private to the seller (and admins): it is left out unless
// the caller says this viewer may see it. Everyone else only learns whether it
// was met, and only once the auction is over, so it can't be probed while live.
export function toPublicItem(row, { includeReserve = false } = {}) {
  const reserve = toNum(row.reserve_price);
  const ended = row.end_at ? new Date(row.end_at).getTime() < Date.now() : false;
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
    hasReserve: reserve !== null,
    reserveMet: reserve === null ? true : (ended ? toNum(row.current_bid) >= reserve : null),
    ...(includeReserve ? { reservePrice: reserve } : {}),
    endAt: toMs(row.end_at),
    highestBidderId: row.highest_bidder_id,
    attributes: row.attributes || {},
    paymentMethods: acceptedMethods({ paymentMethods: row.payment_methods }),
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

// Returns the cleaned list, or null when nothing valid was chosen — callers
// turn that into a 400 because a listing must accept at least one method.
export function parsePaymentMethods(raw) {
  const list = normalizePaymentMethods(raw);
  return list.length > 0 ? list : null;
}

// For server-side rules only (it carries the reserve) — never send the result
// of this to a client as it is.
export async function getItemById(sql, id) {
  const rows = await sql`SELECT * FROM items WHERE id = ${id}`;
  // A listing its seller took down can't be bought or settled.
  return rows[0] && !rows[0].removed_at ? toPublicItem(rows[0], { includeReserve: true }) : null;
}

// Returns (row) => may this requester see that row's reserve price?
export async function reserveViewer(sql, userId) {
  if (!userId) return () => false;
  const rows = await sql`SELECT is_admin FROM users WHERE id = ${userId}`;
  const isAdmin = Boolean(rows[0]?.is_admin);
  return (row) => isAdmin || row.seller_id === String(userId);
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
