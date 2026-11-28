const get = async (query) => {
    const res = await fetch(`/api/reviews?${query}`);
    if (!res.ok) throw new Error('Could not load reviews');
    return res.json();
};

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

// role: 'seller' or 'buyer', the side of the person being reviewed.
export const fetchReviews = (userId, role) =>
    get(`${role === 'buyer' ? 'buyerId' : 'sellerId'}=${encodeURIComponent(userId)}`);
export const fetchBuyerRatings = (ids) => get(`buyerIds=${ids.map(encodeURIComponent).join(',')}`).then(r => r.ratings);
export const fetchMyReviews = () => get('mine=1');

export const submitReview = (orderId, rating, comment) => post({ orderId, rating, comment });
export const removeReview = (reviewId) => post({ action: 'remove', reviewId });
