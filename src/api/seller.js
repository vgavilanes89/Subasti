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
        soldAt: now - 2 * day,
        shipBy: now + 3 * day,
        trackingNumber: null,
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
        soldAt: now - 12 * day,
        shipBy: null,
        trackingNumber: null,
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
        soldAt: now - 25 * day,
        shipBy: now - 22 * day,
        trackingNumber: 'CR-8849201',
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
        soldAt: now - 1 * day,
        shipBy: now + 5 * day,
        trackingNumber: null,
    },
];

export const fetchSellerOrders = async (sellerId) => {
    await new Promise(r => setTimeout(r, 150));
    return ORDERS.filter(o => o.sellerId === sellerId).sort((a, b) => b.soldAt - a.soldAt);
};

export const markOrderShipped = async (orderId, trackingNumber = '') => {
    await new Promise(r => setTimeout(r, 200));
    const order = ORDERS.find(o => o.id === orderId);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    const updated = {
        ...order,
        status: order.fulfillment === 'pickup' ? 'completed' : 'shipped',
        trackingNumber: trackingNumber.trim() || order.trackingNumber,
    };
    ORDERS = ORDERS.map(o => (o.id === orderId ? updated : o));
    return updated;
};
