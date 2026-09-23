import React, { useEffect, useState } from 'react';
import { useHomeFilters } from '../context/HomeFilterContext';
import { tCategory, tSubCategory } from '../data/i18n';

// Left-pane category/subcategory navigator for the homepage. Separate from
// the dropdown + link row already in the filter bar — this is additive, not
// a replacement, so it shares the same cat/subCat filter state via context
// rather than owning its own.
const CategoryTree = ({ categories, loc }) => {
    const { cat, setCat, subCat, setSubCat } = useHomeFilters();
    const [expanded, setExpanded] = useState(() => new Set(cat !== '*' ? [cat] : []));

    // Keep the active category's branch open if it was selected from
    // elsewhere (the dropdown, the link row, or a reset).
    useEffect(() => {
        if (cat !== '*') {
            setExpanded((prev) => (prev.has(cat) ? prev : new Set(prev).add(cat)));
        }
    }, [cat]);

    const toggle = (key) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    const L = loc === 'en'
        ? { title: 'Categories', all: 'All Categories', expand: 'Expand', collapse: 'Collapse' }
        : { title: 'Categorías', all: 'Todas las Categorías', expand: 'Expandir', collapse: 'Colapsar' };

    return (
        <nav className="category-tree" aria-label={L.title}>
            <h3 className="category-tree-title">{L.title}</h3>
            <button
                type="button"
                onClick={() => setCat('*')}
                className={`category-tree-link category-tree-link--all ${cat === '*' ? 'is-active' : ''}`}
            >
                {L.all}
            </button>
            <ul className="category-tree-list">
                {Object.entries(categories).map(([key, subs]) => {
                    const isOpen = expanded.has(key);
                    const isActiveCat = cat === key;
                    return (
                        <li key={key} className="category-tree-item">
                            <div className="category-tree-row">
                                <button
                                    type="button"
                                    onClick={() => setCat(key)}
                                    className={`category-tree-link ${isActiveCat && subCat === '*' ? 'is-active' : ''}`}
                                >
                                    {tCategory(key, loc)}
                                </button>
                                {subs.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => toggle(key)}
                                        className="category-tree-toggle"
                                        aria-label={isOpen ? L.collapse : L.expand}
                                        aria-expanded={isOpen}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`category-tree-chevron ${isOpen ? 'is-open' : ''}`}>
                                            <path d="m9 18 6-6-6-6" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            {isOpen && subs.length > 0 && (
                                <ul className="category-tree-sublist">
                                    {subs.map((sub) => (
                                        <li key={sub}>
                                            <button
                                                type="button"
                                                onClick={() => { setCat(key); setSubCat(sub); }}
                                                className={`category-tree-sublink ${isActiveCat && subCat === sub ? 'is-active' : ''}`}
                                            >
                                                {tSubCategory(sub, loc)}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};

export default CategoryTree;
