import { ESCROW_WINDOW_MS, ORDER_STATUS } from '../data/escrow';

const now = Date.now();
const day = 24 * 60 * 60 * 1000;
const h48 = ESCROW_WINDOW_MS;

let ORDERS = [
    {
        id: 'ord1',
        sellerId: 'user1',
        buyerId: 'user2',
        itemId: 'sold1',
        itemTitle: 'AirPods Pro 2da Gen',
        image: 'https://placehold.co/80x80/6366f1/ffffff?text=Pods',
        amount: 85000,
        currency: 'CRC',
        shippingCost: 2500,
        status: ORDER_STATUS.ESCROW_HELD,
        fulfillment: 'ship',
        orderType: 'buy_now',
        purchasedAt: now - 2 * day,
        paymentDueAt: null,
        escrowHeldAt: now - 2 * day,
        shipByAt: now + 1 * day,
        shippingTimeframe: null,
        shippedAt: null,
        estimatedDelivery: null,
        trackingNumber: null,
        receivedAt: null,
        confirmationDueAt: null,
        claimReason: null,
        paymentMethod: 'card',
    },
    {
        id: 'ord2',
        sellerId: 'user1',
        buyerId: 'user2',
        itemId: 'sold2',
        itemTitle: 'Kindle Paperwhite',
        image: 'https://placehold.co/80x80/0ea5e9/ffffff?text=Kindle',
        amount: 65000,
        currency: 'CRC',
        shippingCost: 0,
        status: ORDER_STATUS.COMPLETED,
        fulfillment: 'pickup',
        orderType: 'buy_now',
        purchasedAt: now - 12 * day,
        escrowHeldAt: now - 12 * day,
        shipByAt: now - 11 * day,
        shippingTimeframe: 'Pickup same day',
        receivedAt: now - 10 * day,
        confirmationDueAt: now - 10 * day + h48,
        fundsReleasedAt: now - 9 * day,
        paymentMethod: 'sinpe',
    },
    {
        id: 'ord4',
        sellerId: 'user2',
        buyerId: 'user1',
        itemId: 'i2',
        itemTitle: 'Sofá Seccional Gris Moderno',
        image: 'https://placehold.co/80x80/64748b/ffffff?text=Sofa',
        amount: 165000,
        currency: 'CRC',
        shippingCost: 0,
        status: ORDER_STATUS.ESCROW_HELD,
        fulfillment: 'pickup',
        orderType: 'auction_won',
        purchasedAt: now - 1 * day,
        escrowHeldAt: now - 1 * day,
        shipByAt: now + 1 * day,
        paymentMethod: 'card',
    },
    {
        id: 'ord5',
        sellerId: 'user1',
        buyerId: 'user2',
        itemId: 'i4',
        itemTitle: 'Cámara Canon EOS R con Lente 24-105mm',
        image: 'https://placehold.co/80x80/dc2626/ffffff?text=Camara',
        amount: 1560,
        currency: 'USD',
        shippingCost: 15,
        status: ORDER_STATUS.PENDING_PAYMENT,
        fulfillment: 'ship',
        orderType: 'auction_won',
        purchasedAt: now - 4 * 60 * 60 * 1000,
        paymentDueAt: now + h48,
        paymentMethod: null,
    },
    {
        id: 'ord6',
        sellerId: 'user2',
        buyerId: 'user1',
        itemId: 'i5',
        itemTitle: 'Taladro Inalámbrico 20V',
        image: 'https://placehold.co/80x80/f59e0b/ffffff?text=Taladro',
        amount: 45000,
        currency: 'CRC',
        shippingCost: 2500,
        status: ORDER_STATUS.AWAITING_CONFIRMATION,
        fulfillment: 'ship',
        orderType: 'buy_now',
        purchasedAt: now - 5 * day,
        escrowHeldAt: now - 5 * day,
        shipByAt: now - 4 * day,
        shippingTimeframe: '3-5 business days',
        shippedAt: now - 3 * day,
        estimatedDelivery: now - 1 * day,
        trackingNumber: 'CR-5529104',
        receivedAt: now - 12 * 60 * 60 * 1000,
        confirmationDueAt: now - 12 * 60 * 60 * 1000 + h48,
        paymentMethod: 'card',
    },
    {
        id: 'ord7',
        sellerId: 'user1',
        buyerId: 'user1',
        itemId: 'sold4',
        itemTitle: 'Monitor LG 27" 4K',
        image: 'https://placehold.co/80x80/334155/ffffff?text=Monitor',
        amount: 120000,
        currency: 'CRC',
        shippingCost: 3000,
        status: ORDER_STATUS.COMPLETED,
        fulfillment: 'ship',
        orderType: 'buy_now',
        purchasedAt: now - 40 * day,
        escrowHeldAt: now - 40 * day,
        shippingTimeframe: '2-4 business days',
        shippedAt: now - 38 * day,
        receivedAt: now - 36 * day,
        fundsReleasedAt: now - 35 * day,
        trackingNumber: 'CR-1102938',
        paymentMethod: 'card',
    },
    {
        id: 'ord8',
        sellerId: 'user2',
        buyerId: 'user2',
        itemId: 'sold5',
        itemTitle: 'Nintendo Switch OLED',
        image: 'https://placehold.co/80x80/e11d48/ffffff?text=Switch',
        amount: 280000,
        currency: 'CRC',
        shippingCost: 0,
        status: ORDER_STATUS.PENDING_PAYMENT,
        fulfillment: 'pickup',
        orderType: 'buy_now',
        purchasedAt: now - 2 * 60 * 60 * 1000,
        paymentDueAt: now + h48,
        paymentMethod: null,
    },
    {
        id: 'ord9',
        sellerId: 'user1',
        buyerId: 'user2',
        itemId: 'sold6',
        itemTitle: 'MacBook Air M2',
        image: 'https://placehold.co/80x80/475569/ffffff?text=Mac',
        amount: 520000,
        currency: 'CRC',
        shippingCost: 3500,
        status: ORDER_STATUS.SHIPPED,
        fulfillment: 'ship',
        orderType: 'buy_now',
        purchasedAt: now - 3 * day,
        escrowHeldAt: now - 3 * day,
        shipByAt: now - 2 * day,
        shippingTimeframe: '2-3 business days',
        shippedAt: now - 2 * day,
        estimatedDelivery: now + 1 * day,
        trackingNumber: 'CR-9912003',
        paymentMethod: 'card',
    },
];

const patchOrder = (orderId, patch) => {
    ORDERS = ORDERS.map(o => (o.id === orderId ? { ...o, ...patch } : o));
    return ORDERS.find(o => o.id === orderId);
};

export const fetchSellerOrders = async (sellerId) => {
    await new Promise(r => setTimeout(r, 150));
    return ORDERS.filter(o => o.sellerId === sellerId).sort((a, b) => b.purchasedAt - a.purchasedAt);
};

export const fetchBuyerOrders = async (buyerId) => {
    await new Promise(r => setTimeout(r, 150));
    return ORDERS.filter(o => o.buyerId === buyerId).sort((a, b) => b.purchasedAt - a.purchasedAt);
};

export const createCheckoutOrders = async ({ buyerId, items, fulfillment, paymentMethod }) => {
    await new Promise(r => setTimeout(r, 300));
    const created = items.map((item, idx) => {
        const id = `ord_${Date.now()}_${idx}`;
        const amount = (item.buyNowPrice || item.price) * (item.qty || 1);
        const order = {
            id,
            sellerId: item.sellerId,
            buyerId,
            itemId: item.id,
            itemTitle: item.title,
            image: item.image,
            amount,
            currency: item.currency || 'CRC',
            shippingCost: fulfillment === 'ship' ? (item.shippingCost || 0) : 0,
            status: ORDER_STATUS.ESCROW_HELD,
            fulfillment,
            orderType: 'buy_now',
            purchasedAt: Date.now(),
            paymentDueAt: null,
            escrowHeldAt: Date.now(),
            shipByAt: Date.now() + h48,
            shippingTimeframe: null,
            shippedAt: null,
            estimatedDelivery: null,
            trackingNumber: null,
            receivedAt: null,
            confirmationDueAt: null,
            claimReason: null,
            paymentMethod,
        };
        return order;
    });
    ORDERS = [...created, ...ORDERS];
    return created;
};

export const payBuyerOrder = async (orderId, paymentMethod = 'card') => {
    await new Promise(r => setTimeout(r, 250));
    const order = ORDERS.find(o => o.id === orderId);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (order.status !== ORDER_STATUS.PENDING_PAYMENT) throw new Error('NOT_PAYABLE');

    return patchOrder(orderId, {
        status: ORDER_STATUS.ESCROW_HELD,
        paymentMethod,
        paymentDueAt: null,
        escrowHeldAt: Date.now(),
        shipByAt: Date.now() + h48,
    });
};

export const markOrderShipped = async (orderId, { trackingNumber = '', shippingTimeframe = '' } = {}) => {
    await new Promise(r => setTimeout(r, 200));
    const order = ORDERS.find(o => o.id === orderId);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (order.status !== ORDER_STATUS.ESCROW_HELD) throw new Error('FUNDS_NOT_SECURED');

    const timeframe = shippingTimeframe.trim();
    if (!timeframe) throw new Error('TIMEFRAME_REQUIRED');

    const shippedAt = Date.now();
    return patchOrder(orderId, {
        status: ORDER_STATUS.SHIPPED,
        trackingNumber: trackingNumber.trim() || null,
        shippingTimeframe: timeframe,
        shippedAt,
        estimatedDelivery: shippedAt + 5 * day,
    });
};

export const markOrderReadyForPickup = async (orderId, { shippingTimeframe = '' } = {}) => {
    await new Promise(r => setTimeout(r, 200));
    const order = ORDERS.find(o => o.id === orderId);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (order.status !== ORDER_STATUS.ESCROW_HELD) throw new Error('FUNDS_NOT_SECURED');

    const timeframe = shippingTimeframe.trim();
    if (!timeframe) throw new Error('TIMEFRAME_REQUIRED');

    return patchOrder(orderId, {
        status: ORDER_STATUS.SHIPPED,
        shippingTimeframe: timeframe,
        shippedAt: Date.now(),
    });
};

export const confirmOrderReceived = async (orderId) => {
    await new Promise(r => setTimeout(r, 200));
    const order = ORDERS.find(o => o.id === orderId);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (order.status !== ORDER_STATUS.SHIPPED) throw new Error('NOT_SHIPPED');

    const receivedAt = Date.now();
    return patchOrder(orderId, {
        status: ORDER_STATUS.AWAITING_CONFIRMATION,
        receivedAt,
        confirmationDueAt: receivedAt + h48,
    });
};

export const releaseFundsToSeller = async (orderId) => {
    await new Promise(r => setTimeout(r, 200));
    const order = ORDERS.find(o => o.id === orderId);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (order.status !== ORDER_STATUS.AWAITING_CONFIRMATION) throw new Error('NOT_READY');

    return patchOrder(orderId, {
        status: ORDER_STATUS.COMPLETED,
        fundsReleasedAt: Date.now(),
    });
};

export const submitBuyerClaim = async (orderId, reason) => {
    await new Promise(r => setTimeout(r, 250));
    const order = ORDERS.find(o => o.id === orderId);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (order.status !== ORDER_STATUS.AWAITING_CONFIRMATION) throw new Error('CLAIM_WINDOW_CLOSED');

    const trimmed = reason.trim();
    if (!trimmed) throw new Error('REASON_REQUIRED');

    return patchOrder(orderId, {
        status: ORDER_STATUS.CLAIM_PENDING,
        claimReason: trimmed,
        claimFiledAt: Date.now(),
    });
};

export const sellerCancelOrder = async (orderId) => {
    await new Promise(r => setTimeout(r, 200));
    const order = ORDERS.find(o => o.id === orderId);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (order.status !== ORDER_STATUS.PENDING_PAYMENT) throw new Error('CANNOT_CANCEL');

    return patchOrder(orderId, { status: ORDER_STATUS.CANCELLED, cancelledAt: Date.now() });
};

/** @deprecated use releaseFundsToSeller */
export const confirmOrderReceivedLegacy = confirmOrderReceived;
