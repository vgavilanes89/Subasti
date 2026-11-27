import { useState, useEffect, useCallback } from 'react';
import { fetchSellerReviews } from '../api/reviews';

const NONE = { count: 0, average: 0, reviews: [] };

// A seller's reviews and rating. Empty until loaded, and if loading fails.
export const useSellerReviews = (sellerId) => {
    const [data, setData] = useState({ sellerId: null, ...NONE });
    const [version, setVersion] = useState(0);

    useEffect(() => {
        if (!sellerId) return undefined;
        let cancelled = false;
        fetchSellerReviews(sellerId)
            .then((result) => { if (!cancelled) setData({ sellerId, ...result }); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [sellerId, version]);

    const reload = useCallback(() => setVersion((v) => v + 1), []);
    // Never show one seller's reviews while another's are still loading.
    const current = data.sellerId === sellerId ? data : NONE;
    return { count: current.count, average: current.average, reviews: current.reviews, loaded: data.sellerId === sellerId, reload };
};
