import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

// Real accounts aren't in the users map until their public profile is fetched,
// so any screen that shows another person's name (order cards, chat headers)
// must ask for them. Tracked in a ref because ensureUserLoaded changes
// identity on every load, which would otherwise re-request the same id.
export function useEnsureUsers(ids) {
    const { users, ensureUserLoaded } = useAuth();
    const requested = useRef(new Set());
    const key = [...new Set(ids)].filter(Boolean).sort().join(',');

    useEffect(() => {
        for (const id of key ? key.split(',') : []) {
            if (id.startsWith('guest') || users[id] || requested.current.has(id)) continue;
            requested.current.add(id);
            ensureUserLoaded(id);
        }
    }, [key, users, ensureUserLoaded]);
}
