import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchReviews, fetchBuyerRatings, fetchMyReviews } from '../api/reviews';
import { useRefreshOnNotification } from './useRefreshOnNotification';

const NONE = { count: 0, average: 0, reviews: [] };

// Someone's reviews and rating, as a 'seller' or a 'buyer'. Empty until loaded,
// and if loading fails.
export const useReviews = (userId, role = 'seller') => {
    const key = userId ? `${role}:${userId}` : null;
    const [data, setData] = useState({ key: null, ...NONE });
    const [version, setVersion] = useState(0);

    useEffect(() => {
        if (!userId) return undefined;
        let cancelled = false;
        fetchReviews(userId, role)
            .then((result) => { if (!cancelled) setData({ key: `${role}:${userId}`, ...result }); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [userId, role, version]);

    const reload = useCallback(() => setVersion((v) => v + 1), []);
    // Never show one person's reviews while another's are still loading.
    const current = data.key === key ? data : NONE;
    return { count: current.count, average: current.average, reviews: current.reviews, loaded: data.key === key, reload };
};

// { buyerId: {count, average} } for the buyers in a sales list.
export const useBuyerRatings = (ids) => {
    const joined = useMemo(() => [...new Set(ids)].filter(Boolean).sort().join(','), [ids]);
    const [ratings, setRatings] = useState(null);
    useEffect(() => {
        if (!joined) return undefined;
        let cancelled = false;
        fetchBuyerRatings(joined.split(','))
            .then((result) => { if (!cancelled) setRatings(result); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [joined]);
    return ratings;
};

// What the signed-in person has reviewed and where someone is waiting on them.
// null until known, so no order offers a review it may already have.
export const useMyReviews = (userId) => {
    const [state, setState] = useState(null);
    const reload = useCallback(() => {
        fetchMyReviews()
            .then((r) => setState(r.available ? r : null))
            .catch(() => {});
    }, []);
    useEffect(() => { reload(); }, [reload, userId]);
    useRefreshOnNotification(reload);
    return [state, reload];
};
