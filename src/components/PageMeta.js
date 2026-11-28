import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePageMeta } from '../lib/usePageMeta';
import { DEFAULT_META, PAGES, pageTitle } from '../data/pageMeta';

// Titles for the fixed pages. Item, seller and "not found" pages set their own,
// since only they know what they're showing.
const PageMeta = ({ loc }) => {
    const { pathname } = useLocation();
    const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
    const lang = loc === 'en' ? 'en' : 'es';

    useEffect(() => { document.documentElement.lang = lang; }, [lang]);

    let meta = null;
    if (path === '/') {
        meta = DEFAULT_META[lang];
    } else if (PAGES[path]) {
        meta = { title: pageTitle(PAGES[path][lang]), description: DEFAULT_META[lang].description, hidden: PAGES[path].hidden };
    } else if (/^\/sell\/[^/]+$/.test(path)) {
        meta = { title: pageTitle(lang === 'en' ? 'Edit listing' : 'Editar publicación'), hidden: true };
    }
    usePageMeta(meta);
    return null;
};

export default PageMeta;
