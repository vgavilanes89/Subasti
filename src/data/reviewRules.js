// Shared by the server and the dashboards.
import { ORDER_STATUS } from './escrow.js';

// Both sides have this long after an order is settled to write a review.
// A review stays hidden until the other side has written too, or this ends.
// Closing the window is what stops someone waiting it out, reading the other
// review and then answering it.
export const REVIEW_WINDOW_DAYS = 14;
const WINDOW_MS = REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export const isReviewable = (status) => status === ORDER_STATUS.COMPLETED || status === ORDER_STATUS.REFUNDED;

// Takes an order as the client sees it (times in ms).
export const reviewClosesAt = (order) =>
    (order.fundsReleasedAt || order.refundedAt || order.purchasedAt) + WINDOW_MS;
