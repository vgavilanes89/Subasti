const now = Date.now();
const day = 24 * 60 * 60 * 1000;

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
        status: 'pending_ship',
        fulfillment: 'ship',
        orderType: 'buy_now',
        purchasedAt: now - 2 * day,
        soldAt: now - 2 * day,
        payBy: null,
        shipBy: now + 3 * day,
        estimatedDelivery: now + 6 * day,
        trackingNumber: null,
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
        status: 'completed',
        fulfillment: 'pickup',
        orderType: 'buy_now',
        purchasedAt: now - 12 * day,
        soldAt: now - 12 * day,
        payBy: null,
        shipBy: null,
        estimatedDelivery: null,
        trackingNumber: null,
        paymentMethod: 'sinpe',
    },
    {
        id: 'ord3',
        sellerId: 'user1',
        buyerId: 'guest1',
        itemId: 'sold3',
        itemTitle: 'Apple Watch SE',
        image: 'https://placehold.co/80x80/f43f5e/ffffff?text=Watch',
        amount: 180,
        currency: 'USD',
        shippingCost: 12,
        status: 'completed',
        fulfillment: 'ship',
        orderType: 'buy_now',
        purchasedAt: now - 25 * day,
        soldAt: now - 25 * day,
        payBy: null,
        shipBy: now - 22 * day,
        estimatedDelivery: now - 20 * day,
        trackingNumber: 'CR-8849201',
        paymentMethod: 'card',
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
        status: 'pending_ship',
        fulfillment: 'pickup',
        orderType: 'auction_won',
        purchasedAt: now - 1 * day,
        soldAt: now - 1 * day,
        payBy: null,
        shipBy: now + 5 * day,
        estimatedDelivery: null,
        trackingNumber: null,
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
        status: 'pending_payment',
        fulfillment: 'ship',
        orderType: 'auction_won',
        purchasedAt: now - 4 * 60 * 60 * 1000,
        soldAt: now - 4 * 60 * 60 * 1000,
        payBy: now + 2 * day,
        shipBy: null,
        estimatedDelivery: null,
        trackingNumber: null,
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
        status: 'shipped',
        fulfillment: 'ship',
        orderType: 'buy_now',
        purchasedAt: now - 5 * day,
        soldAt: now - 5 * day,
        payBy: null,
        shipBy: now - 3 * day,
        estimatedDelivery: now + 2 * day,
        trackingNumber: 'CR-5529104',
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
        status: 'completed',
        fulfillment: 'ship',
        orderType: 'buy_now',
        purchasedAt: now - 40 * day,
        soldAt: now - 40 * day,
        payBy: null,
        shipBy: now - 38 * day,
        estimatedDelivery: now - 35 * day,
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
        status: 'pending_payment',
        fulfillment: 'pickup',
        orderType: 'buy_now',
        purchasedAt: now - 2 * 60 * 60 * 1000,
        soldAt: now - 2 * 60 * 60 * 1000,
        payBy: now + 1 * day,
        shipBy: null,
        estimatedDelivery: null,
        trackingNumber: null,
        paymentMethod: null,
    },
];

export const fetchSellerOrders = async (sellerId) => {
    await new Promise(r => setTimeout(r, 150));
    return ORDERS.filter(o => o.sellerId === sellerId).sort((a, b) => b.purchasedAt - a.purchasedAt);
};

export const fetchBuyerOrders = async (buyerId) => {
    await new Promise(r => setTimeout(r, 150));
    return ORDERS.filter(o => o.buyerId === buyerId).sort((a, b) => b.purchasedAt - a.purchasedAt);
};

export const markOrderShipped = async (orderId, trackingNumber = '') => {
    await new Promise(r => setTimeout(r, 200));
    const order = ORDERS.find(o => o.id === orderId);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    const updated = {
        ...order,
        status: order.fulfillment === 'pickup' ? 'completed' : 'shipped',
        trackingNumber: trackingNumber.trim() || order.trackingNumber,
        estimatedDelivery: order.fulfillment === 'ship' && !order.estimatedDelivery
            ? Date.now() + 5 * day
            : order.estimatedDelivery,
    };
    ORDERS = ORDERS.map(o => (o.id === orderId ? updated : o));
    return updated;
};

export const payBuyerOrder = async (orderId, paymentMethod = 'card') => {
    await new Promise(r => setTimeout(r, 250));
    const order = ORDERS.find(o => o.id === orderId);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (order.status !== 'pending_payment') throw new Error('NOT_PAYABLE');

    const updated = {
        ...order,
        status: 'pending_ship',
        paymentMethod,
        payBy: null,
        shipBy: order.fulfillment === 'pickup' ? Date.now() + 7 * day : Date.now() + 3 * day,
    };
    ORDERS = ORDERS.map(o => (o.id === orderId ? updated : o));
    return updated;
};

export const confirmOrderReceived = async (orderId) => {
    await new Promise(r => setTimeout(r, 200));
    const order = ORDERS.find(o => o.id === orderId);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    const updated = { ...order, status: 'completed' };
    ORDERS = ORDERS.map(o => (o.id === orderId ? updated : o));
    return updated;
};
