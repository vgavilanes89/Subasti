// Titles and descriptions for the browser tab, search results and shared links.
// public/index.html repeats the Spanish default for readers that don't run
// JavaScript (link previews): change both together.
export const SITE_NAME = 'Subasti';

export const DEFAULT_META = {
    es: {
        title: 'Subasti | Subastas y mercado en Costa Rica',
        description: 'Compra, vende y subasta en Costa Rica, con tu pago protegido hasta que recibes el artículo.',
    },
    en: {
        title: 'Subasti | Auctions and marketplace in Costa Rica',
        description: 'Buy, sell and auction in Costa Rica, with your payment held safely until you receive the item.',
    },
};

// Fixed pages. `hidden` keeps personal or one-off pages out of search results.
export const PAGES = {
    '/about': { es: 'Sobre Nosotros', en: 'About Us' },
    '/help': { es: 'Centro de Ayuda', en: 'Help Center' },
    '/faq': { es: 'Preguntas frecuentes', en: 'FAQ' },
    '/contact': { es: 'Contáctanos', en: 'Contact Us' },
    '/careers': { es: 'Empleos', en: 'Careers' },
    '/terms': { es: 'Términos y Condiciones', en: 'Terms and Conditions' },
    '/privacy': { es: 'Política de Privacidad', en: 'Privacy Policy' },
    '/login': { es: 'Iniciar sesión', en: 'Log in' },
    '/signup': { es: 'Crear cuenta', en: 'Sign up' },
    '/forgot-password': { es: 'Recuperar contraseña', en: 'Forgot password', hidden: true },
    '/reset-password': { es: 'Nueva contraseña', en: 'Reset password', hidden: true },
    '/verify-email': { es: 'Confirmar correo', en: 'Confirm email', hidden: true },
    '/sell': { es: 'Vender', en: 'Sell' },
    '/profile': { es: 'Mi perfil', en: 'My profile', hidden: true },
    '/favorites': { es: 'Favoritos', en: 'Favorites', hidden: true },
    '/cart': { es: 'Carrito', en: 'Cart', hidden: true },
    '/checkout': { es: 'Pago', en: 'Checkout', hidden: true },
    '/admin': { es: 'Administración', en: 'Admin', hidden: true },
};

export const pageTitle = (name) => `${name} | ${SITE_NAME}`;

// One line for a description: no line breaks, cut at a word.
export const summarize = (text, max = 160) => {
    const line = String(text || '').replace(/\s+/g, ' ').trim();
    if (line.length <= max) return line;
    return `${line.slice(0, max).replace(/\s+\S*$/, '')}…`;
};
