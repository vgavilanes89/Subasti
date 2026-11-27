const post = async (body) => {
    const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'REQUEST_FAILED');
    }
    return res.json();
};

export const fetchSellerReviews = async (sellerId) => {
    const res = await fetch(`/api/reviews?sellerId=${encodeURIComponent(sellerId)}`);
    if (!res.ok) throw new Error('Could not load reviews');
    return res.json();
};

export const fetchMyReviewedOrders = async () => {
    const res = await fetch('/api/reviews?mine=1');
    if (!res.ok) throw new Error('Could not load reviews');
    return res.json();
};

export const submitReview = (orderId, rating, comment) => post({ orderId, rating, comment });
export const removeReview = (reviewId) => post({ action: 'remove', reviewId });
