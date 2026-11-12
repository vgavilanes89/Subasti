import React, { createContext, useContext, useState, useEffect } from 'react';
import { useItems } from './ItemsContext';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const { items } = useItems();
    const { user } = useAuth();

    // Sellers can't buy their own listings. Besides refusing to add them
    // below, this clears any that are already in the cart (e.g. added while
    // logged out, then the seller logs in).
    useEffect(() => {
        if (!user) return;
        setCart(current => {
            const kept = current.filter(ci => items.find(i => i.id === ci.id)?.sellerId !== user.id);
            return kept.length === current.length ? current : kept;
        });
    }, [user, items]);

    // Returns true if the item was added.
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

    const clearCart = () => setCart([]);

    const cartCount = cart.reduce((total, item) => total + item.qty, 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount }}>
            {children}
        </CartContext.Provider>
    );
};