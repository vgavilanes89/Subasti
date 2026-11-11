import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../api/auth';
import * as accountApi from '../api/account';

const AuthContext = createContext();

// Idle timeout (matches the 3h session lifetime on the server).
const IDLE_LIMIT_MS = 3 * 60 * 60 * 1000;
const KEEPALIVE_EVERY_MS = 5 * 60 * 1000;
// Shared across tabs so activity in one tab keeps the whole session alive.
const LAST_ACTIVITY_KEY = 'subasti_last_activity';
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];

export const useAuth = () => useContext(AuthContext);

async function parseErrorMessage(res, fallback) {
    try {
        const body = await res.json();
        return body?.error || fallback;
    } catch {
        return fallback;
    }
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    // Real accounts (from /api/auth/*) aren't in this mock map, so merge each
    // one in on login/signup/session-restore — the rest of the app (seller
    // profiles, reviews, messages) still reads other users from here.
    const [usersMap, setUsersMap] = useState(authService.getAllUsers());

    useEffect(() => {
        let cancelled = false;
        fetch('/api/auth/me')
            .then((res) => (res.ok ? res.json() : null))
            .then((restoredUser) => {
                if (cancelled || !restoredUser) return;
                setUser(restoredUser);
                setUsersMap(prev => ({ ...prev, [restoredUser.id]: restoredUser }));
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, []);

    // Ends the session after 3 hours with no user activity. Background polling
    // (chat, notifications) is not activity — only real input is — so a tab
    // left open on a shared computer does time out.
    useEffect(() => {
        if (!user) return undefined;

        let lastWrite = 0;
        let lastKeepalive = Date.now();
        let expiring = false;
        let fallbackLast = Date.now();

        const readLast = () => {
            try {
                return Number(localStorage.getItem(LAST_ACTIVITY_KEY)) || fallbackLast;
            } catch {
                return fallbackLast;
            }
        };
        const writeLast = (now) => {
            fallbackLast = now;
            try { localStorage.setItem(LAST_ACTIVITY_KEY, String(now)); } catch { /* storage unavailable */ }
        };
        const expire = async () => {
            if (expiring) return;
            expiring = true;
            try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* cookie expires on its own */ }
            window.location.assign('/login?expired=1');
        };
        const onActivity = () => {
            const now = Date.now();
            // Returning after the limit (e.g. a laptop that was asleep, when no
            // timer could fire) counts as expired, not as fresh activity.
            if (now - readLast() >= IDLE_LIMIT_MS) {
                expire();
                return;
            }
            if (now - lastWrite > 10000) {
                lastWrite = now;
                writeLast(now);
            }
            if (now - lastKeepalive >= KEEPALIVE_EVERY_MS) {
                lastKeepalive = now;
                fetch('/api/auth/keepalive', { method: 'POST' })
                    .then((res) => { if (res.status === 401) expire(); })
                    .catch(() => { /* transient; the next activity retries */ });
            }
        };

        writeLast(Date.now());
        ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
        document.addEventListener('visibilitychange', onActivity);
        const timer = setInterval(() => {
            if (Date.now() - readLast() >= IDLE_LIMIT_MS) expire();
        }, 60 * 1000);

        return () => {
            ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
            document.removeEventListener('visibilitychange', onActivity);
            clearInterval(timer);
        };
    }, [user]);

    const login = async (email, password) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
            throw new Error(await parseErrorMessage(res, 'Invalid credentials'));
        }
        const loggedUser = await res.json();
        setUser(loggedUser);
        setUsersMap(prev => ({ ...prev, [loggedUser.id]: loggedUser }));
        return loggedUser;
    };

    const logout = async () => {
        setUser(null);
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch {
            // Client-side state is already cleared; a failed request here just
            // leaves a stale cookie that the next /api/auth/me call will reject.
        }
    };

    const signup = async (userData) => {
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        if (!res.ok) {
            throw new Error(await parseErrorMessage(res, 'Could not create account'));
        }
        const newUser = await res.json();
        setUser(newUser);
        setUsersMap(prev => ({...prev, [newUser.id]: newUser}));
        return newUser;
    };

    // Item/seller-profile pages need to display sellers who haven't
    // necessarily logged in during this session — usersMap only tracks
    // demo accounts plus whoever has. This fetches a seller's public
    // profile on demand and merges it in, so `users[sellerId]` resolves
    // for any real account, not just ones already in the map.
    const ensureUserLoaded = useCallback(async (id) => {
        if (!id || usersMap[id]) return usersMap[id];
        try {
            const res = await fetch(`/api/users/get?id=${encodeURIComponent(id)}`);
            if (!res.ok) return null;
            const profile = await res.json();
            setUsersMap(prev => (prev[id] ? prev : { ...prev, [id]: profile }));
            return profile;
        } catch {
            return null;
        }
    }, [usersMap]);

    const updateProfile = async ({ profileName, phone, returnPolicy }) => {
        const updatedUser = await accountApi.updateProfile({ profileName, phone, returnPolicy });
        setUser(updatedUser);
        setUsersMap(prev => ({ ...prev, [updatedUser.id]: updatedUser }));
        return updatedUser;
    };

    // Address & Payment handlers (Moved from App.js)
    const saveAddress = (address) => {
        if (!user) return;
        const updatedUser = { ...user };
        const addresses = updatedUser.savedAddresses || [];
        if (address.id) {
            updatedUser.savedAddresses = addresses.map(a => a.id === address.id ? address : a);
        } else {
            const newAddress = { ...address, id: `addr_${Date.now()}` };
            updatedUser.savedAddresses = [...addresses, newAddress];
        }
        setUser(updatedUser);
    };

    const deleteAddress = (addressId) => {
        if (!user) return;
        const updatedUser = { ...user, savedAddresses: user.savedAddresses.filter(a => a.id !== addressId) };
        setUser(updatedUser);
    };

    const savePayment = (payment) => {
        if (!user) return;
        const updatedUser = { ...user };
        const payments = updatedUser.savedPayments || [];
        if (payment.id) {
            updatedUser.savedPayments = payments.map(p => p.id === payment.id ? payment : p);
        } else {
            const newPayment = { ...payment, id: `pay_${Date.now()}` };
            updatedUser.savedPayments = [...payments, newPayment];
        }
        setUser(updatedUser);
    };

    const deletePayment = (paymentId) => {
        if (!user) return;
        const updatedUser = { ...user, savedPayments: user.savedPayments.filter(p => p.id !== paymentId) };
        setUser(updatedUser);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            users: usersMap, // Expose all users for read-only (like reviews)
            login,
            logout,
            signup,
            updateProfile,
            ensureUserLoaded,
            saveAddress,
            deleteAddress,
            savePayment,
            deletePayment
        }}>
            {children}
        </AuthContext.Provider>
    );
};