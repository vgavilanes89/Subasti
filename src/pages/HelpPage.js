import React from 'react';
import { Link } from 'react-router-dom';
import { StaticPage, StaticSection } from '../components/StaticPage';

const HelpPage = ({ loc }) => {
    const L = loc === 'en' ? {
        title: 'Help Center',
        subtitle: 'Quick guides for buying, selling, and using Subasti.',
        buy: 'Buying',
        buy1: 'Browse listings on the home page or search by keyword and category.',
        buy2: 'Add items to your cart for fixed-price listings or place a bid on auctions.',
        buy3: 'Complete checkout — payment is held in Subasti escrow until you receive the item.',
        buy4: 'After delivery, release funds in Profile → Buying or file a claim within 48 hours.',
        escrow: 'Secure escrow',
        escrow1: 'Subasti collects payment and holds it until the transaction is complete.',
        escrow2: 'Sellers ship within 48 hours only after funds are secured; they must post delivery timeframe.',
        escrow3: 'Buyers have 48 hours after receipt to release funds or claim; no response auto-releases to seller.',
        sell: 'Selling',
        sell1: 'Log in and click Sell to create a listing with photos and pricing.',
        sell2: 'Choose colones or US dollars and set shipping or local pickup.',
        sell3: 'For auctions, set a starting bid, optional reserve, and duration.',
        sell4: 'Do not ship until buyer payment is in escrow. Cancel unpaid orders after 48 hours.',
        account: 'Your Account',
        account1: 'Update your profile, saved addresses, and payment methods from Profile.',
        account2: 'View your listings and favorites from the same page.',
        more: 'Need more help?',
        faq: 'See our FAQ',
        contact: 'contact support',
    } : {
        title: 'Centro de Ayuda',
        subtitle: 'Guías rápidas para comprar, vender y usar Subasti.',
        buy: 'Comprar',
        buy1: 'Explore publicaciones en la página principal o busque por palabra clave y categoría.',
        buy2: 'Agregue artículos al carrito o haga una puja en subastas.',
        buy3: 'Complete la compra — el pago queda en depósito Subasti hasta recibir el artículo.',
        buy4: 'Tras la entrega, libere fondos en Perfil → Compras o reclame en 48 horas.',
        escrow: 'Depósito seguro',
        escrow1: 'Subasti cobra y retiene el pago hasta completar la transacción.',
        escrow2: 'Los vendedores envían en 48 horas solo tras asegurar fondos; deben indicar plazo de entrega.',
        escrow3: 'Compradores tienen 48 horas tras recibir para liberar o reclamar; sin respuesta, fondos al vendedor.',
        sell: 'Vender',
        sell1: 'Inicie sesión y haga clic en Vender para crear una publicación con fotos y precios.',
        sell2: 'Elija colones o dólares y configure envío o recogida local.',
        sell3: 'En subastas, defina oferta inicial, reserva opcional y duración.',
        sell4: 'No envíe hasta que el pago esté en depósito. Cancele pedidos sin pago tras 48 horas.',
        account: 'Su Cuenta',
        account1: 'Actualice perfil, direcciones y pagos desde Perfil.',
        account2: 'Vea sus publicaciones y favoritos en la misma página.',
        more: '¿Necesita más ayuda?',
        faq: 'Consulte las preguntas frecuentes',
        contact: 'contacte soporte',
    };

    return (
        <StaticPage title={L.title} subtitle={L.subtitle}>
            <StaticSection heading={L.escrow}>
                <ul className="list-disc list-inside space-y-2">
                    <li>{L.escrow1}</li>
                    <li>{L.escrow2}</li>
                    <li>{L.escrow3}</li>
                </ul>
            </StaticSection>
            <StaticSection heading={L.buy}>
                <ul className="list-disc list-inside space-y-2">
                    <li>{L.buy1}</li>
                    <li>{L.buy2}</li>
                    <li>{L.buy3}</li>
                    <li>{L.buy4}</li>
                </ul>
            </StaticSection>
            <StaticSection heading={L.sell}>
                <ul className="list-disc list-inside space-y-2">
                    <li>{L.sell1}</li>
                    <li>{L.sell2}</li>
                    <li>{L.sell3}</li>
                    <li>{L.sell4}</li>
                </ul>
            </StaticSection>
            <StaticSection heading={L.account}>
                <ul className="list-disc list-inside space-y-2">
                    <li>{L.account1}</li>
                    <li>{L.account2}</li>
                </ul>
            </StaticSection>
            <StaticSection heading={L.more}>
                <p>
                    <Link to="/faq" className="text-purple-600 font-semibold hover:underline">{L.faq}</Link>
                    {' '}{loc === 'en' ? 'or' : 'o'}{' '}
                    <Link to="/contact" className="text-purple-600 font-semibold hover:underline">{L.contact}</Link>.
                </p>
            </StaticSection>
        </StaticPage>
    );
};

export default HelpPage;
