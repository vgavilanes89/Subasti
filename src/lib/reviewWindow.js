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
