import React from 'react';
import { StaticPage, StaticSection } from '../components/StaticPage';

const TermsPage = ({ loc }) => {
    const L = loc === 'en' ? {
        title: 'Terms and Conditions',
        subtitle: 'Last updated: June 2026. By using Subasti you agree to these terms.',
        use: 'Use of the Platform',
        useText: 'Subasti provides a marketplace for listings, auctions, and checkout. You must be at least 18 years old and provide accurate account information. You are responsible for activity under your account.',
        listings: 'Listings & Transactions',
        listingsText: 'Sellers must describe items honestly and deliver as promised. Buyers must pay agreed amounts on time. Subasti may remove listings that violate policies or applicable law.',
        fees: 'Fees',
        feesText: 'Listing and transaction fees, if any, will be disclosed before you publish or purchase. Prices may be listed in colones (CRC) or US dollars (USD) at the seller\'s choice.',
        disputes: 'Disputes',
        disputesText: 'We encourage buyers and sellers to resolve issues directly. Subasti may assist with mediation but is not a party to private sales between users.',
        liability: 'Limitation of Liability',
        liabilityText: 'Subasti is provided "as is." We are not liable for indirect damages arising from use of the platform, within limits permitted by Costa Rican law.',
    } : {
        title: 'Términos y Condiciones',
        subtitle: 'Última actualización: junio 2026. Al usar Subasti acepta estos términos.',
        use: 'Uso de la Plataforma',
        useText: 'Subasti ofrece un mercado para publicaciones, subastas y pagos. Debe tener al menos 18 años y proporcionar información veraz. Usted es responsable de la actividad en su cuenta.',
        listings: 'Publicaciones y Transacciones',
        listingsText: 'Los vendedores deben describir los artículos con honestidad y entregar según lo prometido. Los compradores deben pagar los montos acordados a tiempo. Subasti puede retirar publicaciones que violen políticas o la ley.',
        fees: 'Tarifas',
        feesText: 'Las tarifas de publicación o transacción, si las hubiera, se informarán antes de publicar o comprar. Los precios pueden listarse en colones (CRC) o dólares (USD) a elección del vendedor.',
        disputes: 'Disputas',
        disputesText: 'Animamos a compradores y vendedores a resolver problemas directamente. Subasti puede ayudar en mediación pero no es parte de las ventas privadas entre usuarios.',
        liability: 'Limitación de Responsabilidad',
        liabilityText: 'Subasti se ofrece "tal cual". No somos responsables por daños indirectos derivados del uso de la plataforma, dentro de los límites permitidos por la ley costarricense.',
    };

    return (
        <StaticPage title={L.title} subtitle={L.subtitle}>
            <StaticSection heading={L.use}><p>{L.useText}</p></StaticSection>
            <StaticSection heading={L.listings}><p>{L.listingsText}</p></StaticSection>
            <StaticSection heading={L.fees}><p>{L.feesText}</p></StaticSection>
            <StaticSection heading={L.disputes}><p>{L.disputesText}</p></StaticSection>
            <StaticSection heading={L.liability}><p>{L.liabilityText}</p></StaticSection>
        </StaticPage>
    );
};

export default TermsPage;
