import React, { createContext, useContext, useState, useCallback } from 'react';

const HomeFilterContext = createContext();

export const useHomeFilters = () => useContext(HomeFilterContext);

export const HomeFilterProvider = ({ children }) => {
    const [q, setQ] = useState('');
    const [cat, setCatRaw] = useState('*');
    const [subCat, setSubCat] = useState('*');
    const [sort, setSort] = useState('newest');

    // Switching top-level category (from either the dropdown, the link row,
    // or the sidebar tree) clears any subcategory filter — otherwise you can
    // end up with a subcategory selected under a category it doesn't belong
    // to, silently matching nothing.
    const setCat = useCallback((value) => {
        setCatRaw(value);
        setSubCat('*');
    }, []);

    const resetFilters = useCallback(() => {
        setQ('');
        setCatRaw('*');
        setSubCat('*');
        setSort('newest');
    }, []);

    return (
        <HomeFilterContext.Provider value={{ q, setQ, cat, setCat, subCat, setSubCat, sort, setSort, resetFilters }}>
            {children}
        </HomeFilterContext.Provider>
    );
};
