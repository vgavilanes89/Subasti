import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import * as notificationsApi from '../api/notifications';

const NotificationsContext = createContext();

export const useNotifications = () => useContext(NotificationsContext);

// Polled rather than pushed, same call as the item page's live-bid sync
// (see [[project-anti-snipe-and-live-sync]] memory) — this app has no
// websocket/SSE infra, and a 30s poll for header-chrome badges is plenty
// fresh without adding a new transport just for this.
const POLL_MS = 30000;

export const NotificationsProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);

    const reload = useCallback(async () => {
        if (!user) {
            setNotifications([]);
            return;
        }
        try {
            const data = await notificationsApi.fetchNotifications();
            setNotifications(data);
        } catch {
            // Transient failure — next poll retries.
        }
    }, [user]);

    useEffect(() => {
        reload();
    }, [reload]);

    useEffect(() => {
        if (!user) return;
        const poll = () => { if (!document.hidden) reload(); };
        const interval = setInterval(poll, POLL_MS);
        document.addEventListener('visibilitychange', poll);
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', poll);
        };
    }, [user, reload]);

    const markRead = useCallback(async (id) => {
        setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
        try {
            await notificationsApi.markNotificationRead(id);
        } catch {
            reload();
        }
    }, [reload]);

    const markAllRead = useCallback(async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        try {
            await notificationsApi.markAllNotificationsRead();
        } catch {
            reload();
        }
    }, [reload]);

    const unreadCount = useMemo(
        () => notifications.filter(n => !n.read).length,
        [notifications]
    );

    return (
        <NotificationsContext.Provider value={{ notifications, unreadCount, reload, markRead, markAllRead }}>
            {children}
        </NotificationsContext.Provider>
    );
};
