import React from 'react';
import { StaticPage, StaticSection } from '../components/StaticPage';

const TermsPage = ({ loc }) => {
    const L = loc === 'en' ? {
        title: 'Terms and Conditions',
        subtitle: 'Last updated: June 2026. By using Subasti you agree to these terms.',
        use: 'Use of the Platform',
        useText: 'Subasti provides a marketplace for listings, auctions, and secure checkout in Costa Rica. You must be at least 18 years old and provide accurate account information. You are responsible for activity under your account.',
        escrow: 'Subasti Secure Escrow',
        escrowText: 'When you buy through Subasti, your payment is collected and held by Subasti in escrow — not released to the seller immediately. Funds are released to the seller only after the buyer confirms satisfaction, or automatically if the buyer does not respond within the protection window described below.',
        buyerPay: 'Buyer payment',
        buyerPayText: 'Buyers must complete payment within 48 hours of winning an auction or placing a buy-now order, unless otherwise stated at checkout. Until payment is secured in escrow, the seller is not required to ship or prepare the item.',
        sellerShip: 'Seller shipping obligations',
        sellerShipText: 'Once payment is secured in escrow, the seller must ship the item (or prepare local pickup) within 48 hours and must post the expected delivery timeframe. Sellers must not begin fulfillment before funds are secured. If payment is not received within 48 hours, the seller may cancel the order and relist the item.',
        buyerConfirm: 'Buyer confirmation & claims',
        buyerConfirmText: 'After the buyer receives the item, they have 48 hours to release funds to the seller or file a claim if the item was not as described or involved fraud. Buyers may release funds immediately through the Buying portal or by responding to the email Subasti sends. If the buyer does not respond within 48 hours, funds are released automatically to the seller.',
        claims: 'Claims & refunds',
        claimsText: 'If a claim is filed within the 48-hour window and Subasti determines it is valid, the buyer will be refunded from escrow. Subasti may request photos, tracking information, or other evidence from both parties. Fraudulent claims or failure to ship as promised may result in account restrictions.',
        listings: 'Listings & accuracy',
        listingsText: 'Sellers must describe items honestly with accurate photos and condition details. Buyers must pay agreed amounts on time. Subasti may remove listings that violate policies or applicable Costa Rican law.',
        fees: 'Fees',
        feesText: 'Listing and transaction fees, if any, will be disclosed before you publish or purchase. Prices may be listed in colones (CRC) or US dollars (USD) at the seller\'s choice.',
        liability: 'Limitation of Liability',
        liabilityText: 'Subasti facilitates secure transactions but is not the seller of listed goods. We are provided "as is" and are not liable for indirect damages arising from use of the platform, within limits permitted by Costa Rican law.',
    } : {
        title: 'Términos y Condiciones',
        subtitle: 'Última actualización: junio 2026. Al usar Subasti acepta estos términos.',
        use: 'Uso de la Plataforma',
        useText: 'Subasti ofrece un mercado para publicaciones, subastas y pagos seguros en Costa Rica. Debe tener al menos 18 años y proporcionar información veraz. Usted es responsable de la actividad en su cuenta.',
        escrow: 'Depósito en Garantía Subasti',
        escrowText: 'Al comprar por Subasti, su pago es cobrado y retenido por Subasti en depósito — no se libera al vendedor de inmediato. Los fondos se liberan al vendedor solo cuando el comprador confirma conformidad, o automáticamente si el comprador no responde dentro del plazo de protección indicado abajo.',
        buyerPay: 'Pago del comprador',
        buyerPayText: 'Los compradores deben completar el pago en 48 horas tras ganar una subasta o realizar una compra directa, salvo otra indicación en el checkout. Hasta que el pago quede asegurado en depósito, el vendedor no está obligado a enviar ni preparar el artículo.',
        sellerShip: 'Obligaciones de envío del vendedor',
        sellerShipText: 'Una vez asegurado el pago en depósito, el vendedor debe enviar el artículo (o preparar recogida local) en 48 horas e indicar el plazo estimado de entrega. Los vendedores no deben iniciar el cumplimiento antes de que los fondos estén asegurados. Si el pago no se recibe en 48 horas, el vendedor puede cancelar el pedido y republicar el artículo.',
        buyerConfirm: 'Confirmación y reclamos del comprador',
        buyerConfirmText: 'Tras recibir el artículo, el comprador tiene 48 horas para liberar fondos al vendedor o presentar un reclamo si el artículo no coincide con la descripción o hubo fraude. Puede liberar fondos de inmediato en el portal de Compras o respondiendo al correo de Subasti. Si no responde en 48 horas, los fondos se liberan automáticamente al vendedor.',
        claims: 'Reclamos y reembolsos',
        claimsText: 'Si se presenta un reclamo dentro de las 48 horas y Subasti lo considera válido, el comprador será reembolsado desde el depósito. Subasti puede solicitar fotos, rastreo u otra evidencia. Reclamos fraudulentos o incumplimiento de envío pueden resultar en restricciones de cuenta.',
        listings: 'Publicaciones y exactitud',
        listingsText: 'Los vendedores deben describir artículos con honestidad, fotos y condición precisas. Los compradores deben pagar a tiempo. Subasti puede retirar publicaciones que violen políticas o la ley costarricense.',
        fees: 'Tarifas',
        feesText: 'Las tarifas de publicación o transacción, si las hubiera, se informarán antes de publicar o comprar. Los precios pueden listarse en colones (CRC) o dólares (USD) a elección del vendedor.',
        liability: 'Limitación de Responsabilidad',
        liabilityText: 'Subasti facilita transacciones seguras pero no es el vendedor de los bienes publicados. Se ofrece "tal cual" y no somos responsables por daños indirectos derivados del uso de la plataforma, dentro de los límites permitidos por la ley costarricense.',
    };

    return (
        <StaticPage title={L.title} subtitle={L.subtitle}>
            <StaticSection heading={L.use}><p>{L.useText}</p></StaticSection>
            <StaticSection heading={L.escrow}><p>{L.escrowText}</p></StaticSection>
            <StaticSection heading={L.buyerPay}><p>{L.buyerPayText}</p></StaticSection>
            <StaticSection heading={L.sellerShip}><p>{L.sellerShipText}</p></StaticSection>
            <StaticSection heading={L.buyerConfirm}><p>{L.buyerConfirmText}</p></StaticSection>
            <StaticSection heading={L.claims}><p>{L.claimsText}</p></StaticSection>
            <StaticSection heading={L.listings}><p>{L.listingsText}</p></StaticSection>
            <StaticSection heading={L.fees}><p>{L.feesText}</p></StaticSection>
            <StaticSection heading={L.liability}><p>{L.liabilityText}</p></StaticSection>
        </StaticPage>
    );
};

export default TermsPage;
