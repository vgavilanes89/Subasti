import { sendMessageNotification } from './email';
import { getUserById } from './auth';

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

let THREADS = [
    {
        id: 'thread1',
        sellerId: 'user1',
        buyerId: 'user2',
        itemId: 'sold1',
        itemTitle: 'AirPods Pro 2da Gen',
        unreadForSeller: 2,
        unreadForBuyer: 0,
        messages: [
            { id: 'm1', from: 'user2', text: 'Hi! When will you ship the AirPods?', at: now - 6 * 60 * 60 * 1000, viaEmail: false },
            { id: 'm2', from: 'user1', text: 'Hello! I will ship them tomorrow morning.', at: now - 5 * 60 * 60 * 1000, viaEmail: false },
            { id: 'm3', from: 'user2', text: 'Perfect, can you share tracking when ready?', at: now - 2 * 60 * 60 * 1000, viaEmail: false },
            { id: 'm4', from: 'user2', text: 'Also — can you include the original box?', at: now - 30 * 60 * 1000, viaEmail: false },
        ],
    },
    {
        id: 'thread2',
        sellerId: 'user1',
        buyerId: 'guest1',
        itemId: 'i4',
        itemTitle: 'Cámara Canon EOS R con Lente 24-105mm',
        unreadForSeller: 0,
        unreadForBuyer: 0,
        messages: [
            { id: 'm5', from: 'guest1', text: 'Is the lens included in the auction?', at: now - 3 * day, viaEmail: true },
            { id: 'm6', from: 'user1', text: 'Yes, the RF 24-105mm lens is included.', at: now - 3 * day + 3600000, viaEmail: false },
        ],
    },
    {
        id: 'thread3',
        sellerId: 'user2',
        buyerId: 'user1',
        itemId: 'i2',
        itemTitle: 'Sofá Seccional Gris Moderno',
        unreadForSeller: 1,
        unreadForBuyer: 0,
        messages: [
            { id: 'm7', from: 'user1', text: 'Can I pick up Saturday afternoon in Heredia?', at: now - 4 * 60 * 60 * 1000, viaEmail: false },
        ],
    },
];

const threadLastAt = (thread) =>
    thread.messages.length ? Math.max(...thread.messages.map(m => m.at)) : 0;

const withMeta = (thread) => ({ ...thread, lastMessageAt: threadLastAt(thread) });

const resolveUser = (userId, users) => {
    if (!userId) return null;
    if (users && users[userId]) return users[userId];
    return getUserById(userId) || null;
};

const notifyRecipient = async (thread, fromUserId, text, users) => {
    const fromUser = resolveUser(fromUserId, users);
    const isFromSeller = fromUserId === thread.sellerId;
    const recipientId = isFromSeller ? thread.buyerId : thread.sellerId;
    const recipient = resolveUser(recipientId, users);
    if (!recipient?.email) return null;

    return sendMessageNotification({
        toEmail: recipient.email,
        toName: recipient.profileName || recipient.realName,
        fromName: fromUser?.profileName || 'Subasti user',
        itemTitle: thread.itemTitle,
        messageText: text,
        threadId: thread.id,
        direction: isFromSeller ? 'to_buyer' : 'to_seller',
    });
};

export const fetchThreadsForUser = async (userId) => {
    await new Promise(r => setTimeout(r, 120));
    return THREADS
        .filter(t => t.sellerId === userId || t.buyerId === userId)
        .map(withMeta)
        .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
};

export const fetchSellerThreads = async (sellerId) => {
    await new Promise(r => setTimeout(r, 120));
    return THREADS
        .filter(t => t.sellerId === sellerId)
        .map(withMeta)
        .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
};

export const fetchBuyerThreads = async (buyerId) => {
    await new Promise(r => setTimeout(r, 120));
    return THREADS
        .filter(t => t.buyerId === buyerId)
        .map(withMeta)
        .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
};

export const findThread = (itemId, buyerId) =>
    THREADS.find(t => t.itemId === itemId && t.buyerId === buyerId);

export const getOrCreateThread = async ({ itemId, itemTitle, sellerId, buyerId }) => {
    await new Promise(r => setTimeout(r, 80));
    let thread = findThread(itemId, buyerId);
    if (!thread) {
        thread = {
            id: `thread_${Date.now()}`,
            sellerId,
            buyerId,
            itemId,
            itemTitle,
            unreadForSeller: 0,
            unreadForBuyer: 0,
            messages: [],
        };
        THREADS = [thread, ...THREADS];
    }
    return withMeta(thread);
};

export const sendMessage = async (threadId, fromUserId, text, users = {}) => {
    await new Promise(r => setTimeout(r, 100));
    const trimmed = text.trim();
    if (!trimmed) throw new Error('EMPTY_MESSAGE');

    const thread = THREADS.find(t => t.id === threadId);
    if (!thread) throw new Error('THREAD_NOT_FOUND');

    const message = {
        id: `m_${Date.now()}`,
        from: fromUserId,
        text: trimmed,
        at: Date.now(),
        viaEmail: false,
    };
    thread.messages = [...thread.messages, message];

    if (fromUserId === thread.sellerId) {
        thread.unreadForBuyer = (thread.unreadForBuyer || 0) + 1;
    } else if (fromUserId === thread.buyerId) {
        thread.unreadForSeller = (thread.unreadForSeller || 0) + 1;
    }

    const emailEntry = await notifyRecipient(thread, fromUserId, trimmed, users);
    return { thread: withMeta({ ...thread }), message, emailEntry };
};

export const markThreadRead = async (threadId, role) => {
    const thread = THREADS.find(t => t.id === threadId);
    if (!thread) return null;
    if (role === 'seller') thread.unreadForSeller = 0;
    if (role === 'buyer') thread.unreadForBuyer = 0;
    return withMeta({ ...thread });
};

export const addEmailReplyToThread = async (threadId, fromUserId, text, users = {}) => {
    const thread = THREADS.find(t => t.id === threadId);
    if (!thread) throw new Error('THREAD_NOT_FOUND');

    const message = {
        id: `m_${Date.now()}`,
        from: fromUserId,
        text: text.trim(),
        at: Date.now(),
        viaEmail: true,
    };
    thread.messages = [...thread.messages, message];

    if (fromUserId === thread.sellerId) {
        thread.unreadForBuyer = (thread.unreadForBuyer || 0) + 1;
    } else {
        thread.unreadForSeller = (thread.unreadForSeller || 0) + 1;
    }

    await notifyRecipient(thread, fromUserId, message.text, users);
    return { thread: withMeta({ ...thread }), message };
};
