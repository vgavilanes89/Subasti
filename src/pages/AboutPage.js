import React from 'react';
import { StaticPage, StaticSection } from '../components/StaticPage';

const AboutPage = ({ loc }) => {
    const L = loc === 'en' ? {
        title: 'About Subasti',
        subtitle: 'Costa Rica\'s marketplace for buying, selling, and auctioning with confidence.',
        mission: 'Our Mission',
        missionText: 'Subasti connects buyers and sellers across Costa Rica through a simple, secure platform for fixed-price sales and live auctions. We believe everyone should be able to turn unused items into value and find great deals close to home.',
        story: 'Our Story',
        storyText: 'Founded in San José, Subasti was built for local commerce: colones or dollars, shipping or pickup, and transparent seller profiles. Whether you are decluttering your home or hunting for a rare find, Subasti is your community marketplace.',
        values: 'What We Stand For',
        trust: 'Trust — Verified profiles, ratings, and clear listing details.',
        local: 'Local first — Designed for Costa Rican provinces, cities, and payment habits.',
        fair: 'Fair trade — Auctions with minimum bids and optional reserve prices protect sellers.',
    } : {
        title: 'Sobre Subasti',
        subtitle: 'El mercado de Costa Rica para comprar, vender y subastar con confianza.',
        mission: 'Nuestra Misión',
        missionText: 'Subasti conecta compradores y vendedores en Costa Rica mediante una plataforma sencilla y segura para ventas a precio fijo y subastas en vivo. Creemos que todos deberían poder convertir artículos sin uso en valor y encontrar buenas ofertas cerca de casa.',
        story: 'Nuestra Historia',
        storyText: 'Fundada en San José, Subasti fue creada para el comercio local: colones o dólares, envío o recogida, y perfiles de vendedor transparentes. Ya sea que estés ordenando tu hogar o buscando un hallazgo único, Subasti es tu mercado comunitario.',
        values: 'Lo Que Nos Representa',
        trust: 'Confianza — Perfiles verificados, calificaciones y detalles claros en cada publicación.',
        local: 'Lo local primero — Diseñado para provincias, cantones y formas de pago costarricenses.',
        fair: 'Comercio justo — Subastas con puja mínima y precio de reserva opcional protegen al vendedor.',
    };

    return (
        <StaticPage title={L.title} subtitle={L.subtitle}>
            <StaticSection heading={L.mission}><p>{L.missionText}</p></StaticSection>
            <StaticSection heading={L.story}><p>{L.storyText}</p></StaticSection>
            <StaticSection heading={L.values}>
                <ul className="list-disc list-inside space-y-2">
                    <li>{L.trust}</li>
                    <li>{L.local}</li>
                    <li>{L.fair}</li>
                </ul>
            </StaticSection>
        </StaticPage>
    );
};

export default AboutPage;
