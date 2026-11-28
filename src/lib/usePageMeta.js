import { useEffect } from 'react';
import { DEFAULT_META } from '../data/pageMeta';

const tag = (name) => {
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
    }
    return el;
};

// Sets the tab title, description and whether search engines may list the page.
// Pass null to leave them alone (e.g. while the page's data is still loading).
export const usePageMeta = (meta) => {
    const { title, description, hidden } = meta || {};
    useEffect(() => {
        if (!title) return;
        document.title = title;
        tag('description').setAttribute('content', description || DEFAULT_META.es.description);
        if (hidden) tag('robots').setAttribute('content', 'noindex');
        else document.querySelector('meta[name="robots"]')?.remove();
    }, [title, description, hidden]);
};
