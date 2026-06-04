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

        setCart(currentCart => {
            const existing = currentCart.find(x => x.id === id);
            if (existing) {
                return currentCart.map(x => x.id === id ? { ...x, qty: x.qty + qtyToAdd } : x);
            }
            return [...currentCart, { id, qty: qtyToAdd, price: item.price || item.buyNowPrice }];
        });
    };

    const removeFromCart = (id) => {
        setCart(current => current.filter(item => item.id !== id));
    };

    const updateQuantity = (id, quantity) => {
        if (quantity <= 0) {
            removeFromCart(id);
        } else {
            setCart(current => current.map(item => item.id === id ? { ...item, qty: quantity } : item));
        }
    };

    const clearCart = () => setCart([]);

    const cartCount = cart.reduce((total, item) => total + item.qty, 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount }}>
            {children}
        </CartContext.Provider>
    );
};