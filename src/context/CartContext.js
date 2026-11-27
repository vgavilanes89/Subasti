import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useItems } from './ItemsContext';
import { useAuth } from './AuthContext';
import { LOGOUT_EVENT } from '../lib/events';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

// The cart is kept in this browser so a refresh (or being signed out for
// inactivity) doesn't lose it. `owner` is the account it belongs to, or null
// for a visitor who hasn't signed in.
const STORAGE_KEY = 'subasti:cart';
const EMPTY = { owner: null, items: [] };

const readStored = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved && Array.isArray(saved.items)) {
            return {
                owner: saved.owner ?? null,
                items: saved.items.filter(ci => ci && typeof ci.id === 'string' && Number.isInteger(ci.qty) && ci.qty > 0),
            };
        }
    } catch { /* storage unavailable or unreadable: start empty */ }
    return EMPTY;
};

export const CartProvider = ({ children }) => {
    const [stored, setStored] = useState(readStored);
    const { items, itemsLoaded } = useItems();
    const { user } = useAuth();

    const setCart = useCallback((next) => {
        setStored(current => {
            const kept = typeof next === 'function' ? next(current.items) : next;
            return kept === current.items ? current : { ...current, items: kept };
        });
    }, []);

    useEffect(() => {
        try {
            if (stored.items.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
            else localStorage.removeItem(STORAGE_KEY);
        } catch { /* storage unavailable: the cart lasts until the page closes */ }
    }, [stored]);

    // Follow changes made in another tab.
    useEffect(() => {
        const onStorage = (e) => { if (e.key === STORAGE_KEY || e.key === null) setStored(readStored()); };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    // Choosing to sign out empties the cart; signing in as someone else does too.
    useEffect(() => {
        const onLogout = () => setStored(EMPTY);
        window.addEventListener(LOGOUT_EVENT, onLogout);
        return () => window.removeEventListener(LOGOUT_EVENT, onLogout);
    }, []);

    useEffect(() => {
        if (!user) return;
        setStored(current => {
            if (current.owner === user.id) return current;
            return { owner: user.id, items: current.owner ? [] : current.items };
        });
    }, [user]);

    // Once the catalog is in, drop what can no longer be bought (removed, sold
    // out, auction over, or your own) and trim quantities to what's in stock.
    useEffect(() => {
        if (!itemsLoaded) return;
        setCart(current => {
            let changed = false;
            const kept = [];
            for (const ci of current) {
                const item = items.find(i => i.id === ci.id);
                const gone = !item
                    || (user && item.sellerId === user.id)
                    || (item.saleType === 'auc' ? !(item.endAt > Date.now()) : !(item.quantity > 0));
                if (gone) { changed = true; continue; }
                const maxQty = item.saleType === 'auc' ? 1 : item.quantity;
                if (ci.qty > maxQty) { changed = true; kept.push({ ...ci, qty: maxQty }); continue; }
                kept.push(ci);
            }
            return changed ? kept : current;
        });
    }, [user, items, itemsLoaded, setCart]);

    // Pages only see lines whose listing is loaded; until then cartLoading.
    const cart = useMemo(
        () => stored.items.filter(ci => items.some(i => i.id === ci.id)),
        [stored.items, items]
    );
    const cartLoading = !itemsLoaded && stored.items.length > 0;

    const addToCart = (id, qtyToAdd = 1) => {
        const item = items.find(i => i.id === id);
        if (!item) return false;
        if (user && item.sellerId === user.id) return false;
        const maxQty = item.quantity ?? Infinity;
        if (maxQty <= 0) return false;

        setCart(currentCart => {
            const existing = currentCart.find(x => x.id === id);
            if (existing) {
                const nextQty = Math.min(existing.qty + qtyToAdd, maxQty);
                return currentCart.map(x => x.id === id ? { ...x, qty: nextQty } : x);
            }
            return [...currentCart, { id, qty: Math.min(qtyToAdd, maxQty), price: item.buyNowPrice || item.price }];
        });
        return true;
    };

    const removeFromCart = (id) => {
        setCart(current => current.filter(item => item.id !== id));
    };

    const updateQuantity = (id, quantity) => {
        const parsed = Math.floor(Number(quantity));
        if (!Number.isFinite(parsed) || parsed <= 0) {
            removeFromCart(id);
            return;
        }
        const item = items.find(i => i.id === id);
        const maxQty = item?.quantity ?? Infinity;
        setCart(current => current.map(x => x.id === id ? { ...x, qty: Math.min(parsed, maxQty) } : x));
    };

    const clearCart = useCallback(() => setCart([]), [setCart]);

    const cartCount = cart.reduce((total, item) => total + item.qty, 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartLoading }}>
            {children}
        </CartContext.Provider>
    );
};