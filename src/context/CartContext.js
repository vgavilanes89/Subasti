import React, { createContext, useContext, useState } from 'react';
import { useItems } from './ItemsContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const { items } = useItems();

    const addToCart = (id, qtyToAdd = 1) => {
        const item = items.find(i => i.id === id);
        if(!item) return;
        const maxQty = item.quantity ?? Infinity;

        setCart(currentCart => {
            const existing = currentCart.find(x => x.id === id);
            if (existing) {
                const nextQty = Math.min(existing.qty + qtyToAdd, maxQty);
                return currentCart.map(x => x.id === id ? { ...x, qty: nextQty } : x);
            }
            return [...currentCart, { id, qty: Math.min(qtyToAdd, maxQty), price: item.buyNowPrice || item.price }];
        });
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