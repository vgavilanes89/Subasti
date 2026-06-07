import React, { createContext, useContext, useState, useCallback } from 'react';

const HomeFilterContext = createContext();

export const useHomeFilters = () => useContext(HomeFilterContext);

export const HomeFilterProvider = ({ children }) => {
    const [q, setQ] = useState('');
    const [cat, setCat] = useState('*');
    const [sort, setSort] = useState('newest');

    const resetFilters = useCallback(() => {
        setQ('');
        setCat('*');
        setSort('newest');
    }, []);

    return (
        <HomeFilterContext.Provider value={{ q, setQ, cat, setCat, sort, setSort, resetFilters }}>
            {children}
        </HomeFilterContext.Provider>
    );
};
