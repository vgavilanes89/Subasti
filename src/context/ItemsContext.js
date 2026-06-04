import React, { createContext, useContext, useState, useEffect } from 'react';
import * as itemsService from '../api/items';

const ItemsContext = createContext();

export const useItems = () => useContext(ItemsContext);

export const ItemsProvider = ({ children }) => {
    const [items, setItems] = useState([]);
    const [favorites, setFavorites] = useState(['i2', 'i4']); // Default demo favorites

    useEffect(() => {
        const load = async () => {
            const data = await itemsService.fetchItems();
            setItems(data);
        };
        load();
    }, []);

    const addItem = async (item) => {
        const newItem = await itemsService.createItem(item);
        setItems(prev => [newItem, ...prev]);
    };

    const removeItem = async (id) => {
        await itemsService.deleteItem(id);
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const toggleFav = (id) => {
        setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
    };

    const isFav = (id) => favorites.includes(id);

    return (
        <ItemsContext.Provider value={{ items, addItem, removeItem, favorites, toggleFav, isFav }}>
            {children}
        </ItemsContext.Provider>
    );
};