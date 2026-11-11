import { useEffect, useRef } from 'react';
import { useNotifications } from '../context/NotificationsContext';

// Order status changes (paid, shipped, received, ...) each create a
// notification for the other party, so a new notification is the cue that the
// orders on screen may be stale. The dashboards otherwise only load orders
// once, when opened.
export function useRefreshOnNotification(refresh) {
    const { notifications } = useNotifications();
    const latestId = notifications[0]?.id ?? null;
    const lastSeen = useRef(undefined);
    const refreshRef = useRef(refresh);
    refreshRef.current = refresh;

    useEffect(() => {
        if (lastSeen.current === undefined) {
            lastSeen.current = latestId;
            return;
        }
        if (latestId !== lastSeen.current) {
            lastSeen.current = latestId;
            refreshRef.current();
        }
    }, [latestId]);
}
