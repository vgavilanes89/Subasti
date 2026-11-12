// Pure bidding math — no DB, no fetch — so it can be imported from both the
// client (src/api/items.js) and serverless functions (api/items/bid.js)
// without pulling in either side's I/O.

// Anti-snipe / soft close: a bid landing inside this window before the
// scheduled end pushes the deadline out by this much, so a last-second bid
// can't win purely by leaving no time for a counter-bid.
export const ANTI_SNIPE_WINDOW_MS = 60 * 1000;
export const ANTI_SNIPE_EXTENSION_MS = 2 * 60 * 1000;

export const getBidIncrement = (currentBid, currency = 'CRC') => {
    if (currency === 'USD') {
        // currentBid * 5 (not * 0.05 * 100) avoids floating-point drift that
        // rounded some increments a cent too high (e.g. 1638 -> 81.91 instead of 81.90).
        // Floor of 5 cents so a $1 item doesn't demand a whole extra dollar.
        return Math.max(0.05, Math.ceil(currentBid * 5) / 100);
    }
    // 5% of the current price, rounded UP to a tidy step that grows with the
    // price (so a ₡100 item asks for +₡10, not a flat +₡1,000 = 10x its price).
    const raw = Math.ceil(currentBid * 0.05);
    const step = currentBid < 1000 ? 10 : currentBid < 10000 ? 50 : currentBid < 100000 ? 100 : 1000;
    return Math.max(10, Math.ceil(raw / step) * step);
};

export const getMinBid = (item) => {
    if (!item || item.saleType !== 'auc') return 0;
    const currency = item.currency || 'CRC';
    const current = item.currentBid ?? item.price ?? 0;
    return current + getBidIncrement(current, currency);
};
