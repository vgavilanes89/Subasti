import React from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../lib/usePageMeta';
import { pageTitle } from '../data/pageMeta';

// Shown for an address that matches nothing, and for a listing or seller that
// isn't there. kind: 'page' | 'item' | 'seller'
const NotFoundPage = ({ loc, kind = 'page' }) => {
    const L = loc === 'en' ? {
        page: ['Page not found', 'The address may be mistyped, or the page has moved.'],
        item: ['Item not found', 'This listing may have been removed, or the link is incomplete.'],
        seller: ['Seller not found', 'This account may no longer exist, or the link is incomplete.'],
        home: 'Browse listings',
        help: 'Help Center',
    } : {
        page: ['Página no encontrada', 'Puede que la dirección esté mal escrita o que la página se haya movido.'],
        item: ['Artículo no encontrado', 'Puede que la publicación se haya retirado o que el enlace esté incompleto.'],
        seller: ['Vendedor no encontrado', 'Puede que la cuenta ya no exista o que el enlace esté incompleto.'],
        home: 'Ver publicaciones',
        help: 'Centro de Ayuda',
    };
    const [heading, text] = L[kind] || L.page;
    usePageMeta({ title: pageTitle(heading), description: text, hidden: true });

    return (
        <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-md border text-center">
            {kind === 'page' && <p className="text-5xl font-extrabold text-purple-600" aria-hidden="true">404</p>}
            <h1 className="text-2xl font-bold text-gray-800 mt-2">{heading}</h1>
            <p className="text-gray-600 mt-2">{text}</p>
            <div className="flex flex-wrap justify-center items-center gap-4 mt-6">
                <Link to="/" className="bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors">{L.home}</Link>
                <Link to="/help" className="tap-target text-purple-600 font-semibold hover:underline">{L.help}</Link>
            </div>
        </div>
    );
};

export default NotFoundPage;
