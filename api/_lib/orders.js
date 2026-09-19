import { randomUUID } from 'crypto';

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
  };
}

export function generateOrderId() {
  return `ord_${randomUUID()}`;
}

export async function getOrderById(sql, id) {
  const rows = await sql`SELECT * FROM orders WHERE id = ${id}`;
  return rows[0] || null;
}
