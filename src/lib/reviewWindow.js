// Orders waiting on the buyer's review: the buyer marked the item received and
// has until `confirmationDueAt` to release the funds or file a claim. Nothing
// releases them automatically, so once that passes an admin has to.

const awaiting = (orders) => orders.filter(o => o.status === 'awaiting_confirmation' && o.confirmationDueAt);

// Past the deadline, longest-waiting first.
export const overdueReviews = (orders, now = Date.now()) =>
    awaiting(orders).filter(o => o.confirmationDueAt < now).sort((a, b) => a.confirmationDueAt - b.confirmationDueAt);

// Still inside the 48 hours.
export const openReviews = (orders, now = Date.now()) =>
    awaiting(orders).filter(o => o.confirmationDueAt >= now);

// "3 d 4 h" / "5 h" / "12 min"
export const formatElapsed = (ms) => {
    const minutes = Math.max(0, Math.floor(ms / 60000));
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h`;
    const days = Math.floor(hours / 24);
    const rest = hours % 24;
    return rest ? `${days} d ${rest} h` : `${days} d`;
};

// ---- Deliveries nobody has confirmed ---------------------------------------
// The 48-hour window only starts when the buyer marks the item received. If
// they never do, the order sits at 'shipped' with no deadline at all.

const DAY_MS = 24 * 60 * 60 * 1000;
// Same figure api/orders/ship.js uses for estimated_delivery. Pickup orders have
// no stored estimate, so it is applied to the day they were marked ready.
const ASSUMED_DELIVERY_DAYS = 5;
export const DEFAULT_GRACE_DAYS = 3;
export const GRACE_DAY_CHOICES = [1, 3, 7, 14];

export const expectedDelivery = (order) =>
    order.estimatedDelivery || (order.shippedAt ? order.shippedAt + ASSUMED_DELIVERY_DAYS * DAY_MS : null);

// Shipped (or ready for pickup), more than `graceDays` past the expected date,
// still not marked received. Longest-overdue first.
export const overdueDeliveries = (orders, graceDays = DEFAULT_GRACE_DAYS, now = Date.now()) =>
    orders
        .filter((o) => o.status === 'shipped' && expectedDelivery(o) && now > expectedDelivery(o) + graceDays * DAY_MS)
        .sort((a, b) => expectedDelivery(a) - expectedDelivery(b));
