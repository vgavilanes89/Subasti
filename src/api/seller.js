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

let THREADS = [
    {
        id: 'thread1',
        sellerId: 'user1',
        buyerId: 'user2',
        itemId: 'ord1',
        itemTitle: 'AirPods Pro 2da Gen',
        unreadForSeller: 2,
        messages: [
            { id: 'm1', from: 'user2', text: 'Hi! When will you ship the AirPods?', at: now - 6 * 60 * 60 * 1000 },
            { id: 'm2', from: 'user1', text: 'Hello! I will ship them tomorrow morning.', at: now - 5 * 60 * 60 * 1000 },
            { id: 'm3', from: 'user2', text: 'Perfect, can you share tracking when ready?', at: now - 2 * 60 * 60 * 1000 },
            { id: 'm4', from: 'user2', text: 'Also — can you include the original box?', at: now - 30 * 60 * 1000 },
        ],
    },
    {
        id: 'thread2',
        sellerId: 'user1',
        buyerId: 'guest1',
        itemId: 'i4',
        itemTitle: 'Cámara Canon EOS R con Lente 24-105mm',
        unreadForSeller: 0,
        messages: [
            { id: 'm5', from: 'guest1', text: 'Is the lens included in the auction?', at: now - 3 * day },
            { id: 'm6', from: 'user1', text: 'Yes, the RF 24-105mm lens is included.', at: now - 3 * day + 3600000 },
        ],
    },
    {
        id: 'thread3',
        sellerId: 'user2',
        buyerId: 'user1',
        itemId: 'i2',
        itemTitle: 'Sofá Seccional Gris Moderno',
        unreadForSeller: 1,
        messages: [
            { id: 'm7', from: 'user1', text: 'Can I pick up Saturday afternoon in Heredia?', at: now - 4 * 60 * 60 * 1000 },
        ],
    },
];

const threadLastAt = (thread) =>
    thread.messages.length ? Math.max(...thread.messages.map(m => m.at)) : 0;

export const fetchSellerOrders = async (sellerId) => {
    await new Promise(r => setTimeout(r, 150));
    return ORDERS.filter(o => o.sellerId === sellerId).sort((a, b) => b.soldAt - a.soldAt);
};

export const fetchSellerThreads = async (sellerId) => {
    await new Promise(r => setTimeout(r, 150));
    return THREADS.filter(t => t.sellerId === sellerId)
        .map(t => ({ ...t, lastMessageAt: threadLastAt(t) }))
        .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
};

export const sendSellerMessage = async (threadId, fromUserId, text) => {
    await new Promise(r => setTimeout(r, 100));
    const trimmed = text.trim();
    if (!trimmed) throw new Error('EMPTY_MESSAGE');

    const thread = THREADS.find(t => t.id === threadId);
    if (!thread) throw new Error('THREAD_NOT_FOUND');

    const message = { id: `m_${Date.now()}`, from: fromUserId, text: trimmed, at: Date.now() };
    thread.messages = [...thread.messages, message];
    if (fromUserId !== thread.sellerId) {
        thread.unreadForSeller = (thread.unreadForSeller || 0) + 1;
    }
    return { thread: { ...thread, lastMessageAt: message.at }, message };
};

export const markThreadRead = async (threadId) => {
    const thread = THREADS.find(t => t.id === threadId);
    if (thread) thread.unreadForSeller = 0;
    return thread;
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
