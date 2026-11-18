import { randomUUID, randomInt } from 'crypto';

// The frontend (BuyerDashboard, SellerDashboard, escrow.js) does plain
// millisecond arithmetic on these fields (e.g. `Date.now() > order.paymentDueAt`),
// so every timestamp column must come back as an epoch-ms number, not a Date/ISO string.
const toMs = (value) => (value ? new Date(value).getTime() : null);

export function toPublicOrder(row) {
  return {
    id: row.id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    itemId: row.item_id,
    itemTitle: row.item_title,
    image: row.image,
    amount: Number(row.amount),
    currency: row.currency,
    shippingCost: Number(row.shipping_cost),
    status: row.status,
    fulfillment: row.fulfillment,
    orderType: row.order_type,
    paymentMethod: row.payment_method,
    purchasedAt: toMs(row.purchased_at),
    paymentDueAt: toMs(row.payment_due_at),
    escrowHeldAt: toMs(row.escrow_held_at),
    shipByAt: toMs(row.ship_by_at),
    shippingTimeframe: row.shipping_timeframe,
    shippedAt: toMs(row.shipped_at),
    estimatedDelivery: toMs(row.estimated_delivery),
    trackingNumber: row.tracking_number,
    receivedAt: toMs(row.received_at),
    confirmationDueAt: toMs(row.confirmation_due_at),
    claimReason: row.claim_reason,
    claimFiledAt: toMs(row.claim_filed_at),
    fundsReleasedAt: toMs(row.funds_released_at),
    cancelledAt: toMs(row.cancelled_at),
    refundedAt: toMs(row.refunded_at),
    resolvedBy: row.resolved_by,
    shippingAddress: row.shipping_address || null,
    quantity: row.quantity || 1,
    paymentReference: row.payment_reference || null,
    paymentReportedAt: toMs(row.payment_reported_at),
    paymentVerifiedAt: toMs(row.payment_verified_at),
  };
}

const ADDRESS_FIELDS = ['fullName', 'address', 'city', 'province', 'postalCode', 'country'];

// Only the known text fields, length-capped; null when there's nothing usable
// (pickup orders, or a client that sent nothing).
export function sanitizeShippingAddress(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const clean = {};
  for (const key of ADDRESS_FIELDS) {
    const value = raw[key];
    clean[key] = typeof value === 'string' ? value.trim().slice(0, 200) : '';
  }
  return clean.address ? clean : null;
}

// Short, easy-to-type code a buyer puts in the SINPE description, e.g. SUB-7K3Q9X.
// No 0/O/1/I so it can be read aloud or retyped without mistakes.
const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function generatePaymentReference() {
  let code = '';
  for (let i = 0; i < 6; i += 1) code += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)];
  return `SUB-${code}`;
}

export function generateOrderId() {
  return `ord_${randomUUID()}`;
}

export async function getOrderById(sql, id) {
  const rows = await sql`SELECT * FROM orders WHERE id = ${id}`;
  return rows[0] || null;
}
