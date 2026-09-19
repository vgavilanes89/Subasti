import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as itemsService from '../api/items';
import * as favoritesApi from '../api/favorites';
import { useAuth } from './AuthContext';

const ItemsContext = createContext();

export const useItems = () => useContext(ItemsContext);

export const ItemsProvider = ({ children }) => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [favorites, setFavorites] = useState([]);

    useEffect(() => {
        const load = async () => {
            const data = await itemsService.fetchItems();
            setItems(data);
        };
        load();
    }, []);

    // Favorites are per-account now (see api/favorites/*), not client-only
    // state — reload them whenever the logged-in user changes, and clear on
    // logout rather than leaking the previous account's list.
    useEffect(() => {
        if (!user) {
            setFavorites([]);
            return;
        }
        favoritesApi.fetchFavorites().then(setFavorites).catch(() => setFavorites([]));
    }, [user]);

    const addItem = async (item) => {
        const newItem = await itemsService.createItem(item);
        setItems(prev => [newItem, ...prev]);
    };

    const removeItem = async (id) => {
        await itemsService.deleteItem(id);
        setItems(prev => prev.filter(i => i.id !== id));
    };

    // Every call site already redirects to /login when there's no user
    // before calling this, so it's safe to assume one here.
    const toggleFav = useCallback(async (id) => {
        setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
        try {
            await favoritesApi.toggleFavorite(id);
        } catch {
            // Revert the optimistic update if the request failed.
            setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
        }
    }, []);

    const isFav = (id) => favorites.includes(id);

    const placeBidOnItem = async (id, amount, bidderId) => {
        const updated = await itemsService.placeBid(id, amount, bidderId);
        setItems(prev => prev.map(i => (i.id === id ? updated : i)));
        return updated;
    };

    return (
        <ItemsContext.Provider value={{ items, addItem, removeItem, placeBid: placeBidOnItem, favorites, toggleFav, isFav }}>
            {children}
        </ItemsContext.Provider>
    );
};
