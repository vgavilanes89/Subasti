export const ESCROW_WINDOW_MS = 48 * 60 * 60 * 1000;

export const ORDER_STATUS = {
    PENDING_PAYMENT: 'pending_payment',
    ESCROW_HELD: 'escrow_held',
    SHIPPED: 'shipped',
    AWAITING_CONFIRMATION: 'awaiting_confirmation',
    CLAIM_PENDING: 'claim_pending',
    REFUNDED: 'refunded',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
};

export const escrowPolicySteps = (loc) => (loc === 'en' ? [
    { title: 'Secure payment', text: 'Your payment is held safely by Subasti — not sent to the seller yet.' },
    { title: 'Seller ships within 48 hours', text: 'Once payment is secured, the seller must ship (or prepare pickup) within 48 hours and post the expected delivery timeframe.' },
    { title: 'You receive the item', text: 'Track your order. When it arrives, confirm receipt in your Buying portal or via the email Subasti sends.' },
    { title: '48-hour protection window', text: 'After receipt you have 48 hours to release funds or file a claim if the item was not as described or was fraudulent.' },
    { title: 'Funds released', text: 'Release funds when satisfied, or funds auto-release to the seller if no response. Approved claims are refunded to you.' },
] : [
    { title: 'Pago seguro', text: 'Su pago queda retenido de forma segura por Subasti — aún no se envía al vendedor.' },
    { title: 'El vendedor envía en 48 horas', text: 'Una vez asegurado el pago, el vendedor debe enviar (o preparar recogida) en 48 horas e indicar el plazo estimado de entrega.' },
    { title: 'Usted recibe el artículo', text: 'Rastree su pedido. Al recibirlo, confirme en su portal de Compras o por el correo que envía Subasti.' },
    { title: 'Ventana de protección de 48 horas', text: 'Después de recibir el artículo tiene 48 horas para liberar fondos o presentar un reclamo si no coincide con la descripción o hay fraude.' },
    { title: 'Fondos liberados', text: 'Libere los fondos si está conforme, o se liberan automáticamente al vendedor sin respuesta. Reclamos aprobados se reembolsan.' },
]);

export const buyerStatusLabel = (order, loc) => {
    const { status, fulfillment } = order;
    const en = {
        pending_payment: 'Complete payment',
        escrow_held: fulfillment === 'pickup' ? 'Awaiting seller pickup prep' : 'Payment secured — awaiting shipment',
        shipped: 'On the way',
        awaiting_confirmation: 'Confirm or claim (48h)',
        claim_pending: 'Claim under review',
        refunded: 'Refunded',
        completed: 'Completed',
        cancelled: 'Cancelled',
    };
    const es = {
        pending_payment: 'Completar pago',
        escrow_held: fulfillment === 'pickup' ? 'Esperando preparación de recogida' : 'Pago asegurado — esperando envío',
        shipped: 'En camino',
        awaiting_confirmation: 'Confirmar o reclamar (48h)',
        claim_pending: 'Reclamo en revisión',
        refunded: 'Reembolsado',
        completed: 'Completado',
        cancelled: 'Cancelado',
    };
    return (loc === 'en' ? en : es)[status] || status;
};

export const sellerStatusLabel = (order, loc) => {
    const { status, fulfillment } = order;
    const en = {
        pending_payment: 'Awaiting buyer payment',
        escrow_held: fulfillment === 'pickup' ? 'Ship/prep within 48h' : 'Funds secured — ship now',
        shipped: 'In transit',
        awaiting_confirmation: 'Buyer review period',
        claim_pending: 'Claim filed',
        refunded: 'Refunded to buyer',
        completed: 'Funds released',
        cancelled: 'Cancelled',
    };
    const es = {
        pending_payment: 'Esperando pago del comprador',
        escrow_held: fulfillment === 'pickup' ? 'Preparar en 48h' : 'Fondos asegurados — enviar',
        shipped: 'En tránsito',
        awaiting_confirmation: 'Período de revisión del comprador',
        claim_pending: 'Reclamo presentado',
        refunded: 'Reembolsado al comprador',
        completed: 'Fondos liberados',
        cancelled: 'Cancelado',
    };
    return (loc === 'en' ? en : es)[status] || status;
};

export const orderStatusClass = (status) => {
    if (status === 'pending_payment' || status === 'escrow_held') return 'seller-badge seller-badge--warn';
    if (status === 'shipped' || status === 'awaiting_confirmation') return 'seller-badge seller-badge--info';
    if (status === 'completed') return 'seller-badge seller-badge--ok';
    if (status === 'claim_pending') return 'seller-badge seller-badge--warn';
    if (status === 'refunded' || status === 'cancelled') return 'seller-badge';
    return 'seller-badge';
};

export const canSellerShip = (order) => order.status === ORDER_STATUS.ESCROW_HELD;

export const canSellerCancel = (order) =>
    order.status === ORDER_STATUS.PENDING_PAYMENT &&
    (!order.paymentDueAt || Date.now() > order.paymentDueAt);
