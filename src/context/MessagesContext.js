import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import * as messagesApi from '../api/messages';

const MessagesContext = createContext();

export const useMessages = () => useContext(MessagesContext);

export const MessagesProvider = ({ children }) => {
    const { user, users } = useAuth();
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lastEmailNotice, setLastEmailNotice] = useState(null);

    const reloadThreads = useCallback(async () => {
        if (!user) {
            setThreads([]);
            return;
        }
        setLoading(true);
        const data = await messagesApi.fetchThreadsForUser(user.id);
        setThreads(data);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        reloadThreads();
    }, [reloadThreads]);

    const getOrCreateThread = useCallback(async ({ itemId, itemTitle, sellerId, buyerId }) => {
        const thread = await messagesApi.getOrCreateThread({ itemId, itemTitle, sellerId, buyerId });
        setThreads(prev => {
            const exists = prev.some(t => t.id === thread.id);
            if (exists) return prev.map(t => (t.id === thread.id ? thread : t));
            return [thread, ...prev].sort((a, b) => b.lastMessageAt - a.lastMessageAt);
        });
        return thread;
    }, []);

    const sendMessage = useCallback(async (threadId, text) => {
        if (!user) throw new Error('NOT_LOGGED_IN');
        const { thread, emailEntry } = await messagesApi.sendMessage(threadId, user.id, text, users);
        setThreads(prev => prev.map(t => (t.id === thread.id ? thread : t)).sort((a, b) => b.lastMessageAt - a.lastMessageAt));
        if (emailEntry) setLastEmailNotice(emailEntry);
        return thread;
    }, [user, users]);

    const markRead = useCallback(async (threadId, role) => {
        const thread = await messagesApi.markThreadRead(threadId, role);
        if (!thread) return;
        setThreads(prev => prev.map(t => (t.id === threadId ? thread : t)));
    }, []);

    const sellerThreads = useMemo(
        () => (user ? threads.filter(t => t.sellerId === user.id) : []),
        [threads, user]
    );

    const buyerThreads = useMemo(
        () => (user ? threads.filter(t => t.buyerId === user.id) : []),
        [threads, user]
    );

    const unreadSellerCount = useMemo(
        () => sellerThreads.reduce((n, t) => n + (t.unreadForSeller || 0), 0),
        [sellerThreads]
    );

    const unreadBuyerCount = useMemo(
        () => buyerThreads.reduce((n, t) => n + (t.unreadForBuyer || 0), 0),
        [buyerThreads]
    );

    return (
        <MessagesContext.Provider value={{
            threads,
            sellerThreads,
            buyerThreads,
            loading,
            reloadThreads,
            getOrCreateThread,
            sendMessage,
            markRead,
            unreadSellerCount,
            unreadBuyerCount,
            lastEmailNotice,
            clearEmailNotice: () => setLastEmailNotice(null),
        }}>
            {children}
        </MessagesContext.Provider>
    );
};
