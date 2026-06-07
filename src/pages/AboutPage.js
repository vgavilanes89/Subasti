import React from 'react';
import { StaticPage, StaticSection } from '../components/StaticPage';

const AboutPage = ({ loc }) => {
    const L = loc === 'en' ? {
        title: 'About Subasti',
        subtitle: 'Costa Rica\'s marketplace for buying, selling, and auctioning with confidence.',
        mission: 'Our Mission',
        missionText: 'Subasti connects buyers and sellers across Costa Rica through secure escrow: payments are held until buyers receive their items and confirm satisfaction. Fixed-price sales, live auctions, and local pickup — all backed by Subasti secure escrow.',
        story: 'Our Story',
        storyText: 'Founded in San José, Subasti was built for local commerce: colones or dollars, shipping or pickup, and transparent seller profiles. Whether you are decluttering your home or hunting for a rare find, Subasti is your community marketplace.',
        values: 'What We Stand For',
        trust: 'Trust — Escrow-held payments, verified profiles, ratings, and clear listing details.',
        escrow: 'Secure escrow — Funds held until delivery is confirmed or the 48-hour protection window ends.',
        local: 'Local first — Designed for Costa Rican provinces, cities, and payment habits.',
        fair: 'Fair trade — Auctions with minimum bids and optional reserve prices protect sellers.',
    } : {
        title: 'Sobre Subasti',
        subtitle: 'El mercado de Costa Rica para comprar, vender y subastar con confianza.',
        mission: 'Nuestra Misión',
        missionText: 'Subasti conecta compradores y vendedores en Costa Rica con depósito en garantía: los pagos se retienen hasta que el comprador recibe y confirma conformidad. Ventas a precio fijo, subastas y recogida local — respaldadas por el depósito en garantía de Subasti.',
        story: 'Nuestra Historia',
        storyText: 'Fundada en San José, Subasti fue creada para el comercio local: colones o dólares, envío o recogida, y perfiles de vendedor transparentes. Ya sea que estés ordenando tu hogar o buscando un hallazgo único, Subasti es tu mercado comunitario.',
        values: 'Lo Que Nos Representa',
        trust: 'Confianza — Pagos en depósito, perfiles verificados, calificaciones y detalles claros.',
        escrow: 'Depósito seguro — Fondos retenidos hasta confirmar entrega o cerrar la ventana de 48 horas.',
        local: 'Lo local primero — Diseñado para provincias, cantones y formas de pago costarricenses.',
        fair: 'Comercio justo — Subastas con puja mínima y precio de reserva opcional protegen al vendedor.',
    };

    return (
        <StaticPage title={L.title} subtitle={L.subtitle}>
            <StaticSection heading={L.mission}><p>{L.missionText}</p></StaticSection>
            <StaticSection heading={L.story}><p>{L.storyText}</p></StaticSection>
            <StaticSection heading={L.values}>
                <ul className="list-disc list-inside space-y-2">
                    <li>{L.escrow}</li>
                    <li>{L.trust}</li>
                    <li>{L.local}</li>
                    <li>{L.fair}</li>
                </ul>
            </StaticSection>
        </StaticPage>
    );
};

export default AboutPage;
