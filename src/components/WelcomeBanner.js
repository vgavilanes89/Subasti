import React from 'react';
import { useAuth } from '../context/AuthContext';

const CONFETTI_COLORS = ['#facc15', '#f472b6', '#34d399', '#60a5fa', '#fb923c', '#a78bfa'];

// Deterministic scatter (no Math.random) so this doesn't reshuffle every
// render — position/timing only need to look organic, not actually be random.
const CONFETTI_PIECES = Array.from({ length: 24 }, (_, i) => ({
    left: `${(i * 17 + 3) % 100}%`,
    background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    animationDelay: `${(i % 8) * 0.35}s`,
    animationDuration: `${3.2 + (i % 5) * 0.4}s`,
}));

// Replaces the homepage hero's static tagline with a personalized greeting
// once the visitor is logged in — same gradient wrapper/classes as before
// (still keyed to the brand's from-purple/via-purple/to-indigo tokens, which
// public/brand-overrides.css remaps to the navy/gold brand palette) so this
// stays in sync with that reskin instead of hardcoding a second color source.
const WelcomeBanner = ({ loc }) => {
    const { user } = useAuth();
    const name = user?.profileName;

    const L = loc === 'en' ? {
        welcomeBack: 'Welcome back',
        welcomeGeneric: 'Welcome to Subasti',
        generic: 'Buy and Sell Your Items Now!',
        subGeneric: 'Join the largest online marketplace in Costa Rica.',
        subPersonal: 'Great deals and live auctions are waiting for you.',
    } : {
        welcomeBack: 'Bienvenido/a de vuelta',
        welcomeGeneric: 'Bienvenido a Subasti',
        generic: '¡Compra y Vende Tus Artículos Ahora!',
        subGeneric: 'Únete al mercado en línea más grande de Costa Rica.',
        subPersonal: 'Grandes ofertas y subastas en vivo te están esperando.',
    };

    const title = name ? `${L.welcomeBack}, ${name}!` : L.generic;
    const subtitle = name ? L.subPersonal : L.subGeneric;

    return (
        <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-500 text-white welcome-banner">
            <div className="welcome-banner-confetti" aria-hidden="true">
                {CONFETTI_PIECES.map((style, i) => (
                    <span key={i} className="confetti-piece" style={style} />
                ))}
            </div>
            <div className="container mx-auto py-8 px-4 text-center welcome-banner-content">
                {!name && <p className="text-3xl font-black tracking-tight sm:text-5xl md:text-6xl">{L.welcomeGeneric}</p>}
                <h2 className={name ? 'text-3xl font-extrabold tracking-tight sm:text-4xl' : 'mt-2 text-xl font-bold tracking-tight sm:text-2xl'}>{title}</h2>
                <p className="mt-2 text-lg text-indigo-100">{subtitle}</p>
            </div>
        </div>
    );
};

export default WelcomeBanner;
