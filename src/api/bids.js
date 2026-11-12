// Auctions the signed-in user has bid on: [{ item, myHighestBid, lastBidAt }].
export const fetchMyBids = async () => {
    const res = await fetch('/api/account/my-bids');
    if (!res.ok) throw new Error('REQUEST_FAILED');
    return res.json();
};
