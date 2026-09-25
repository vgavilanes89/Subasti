// Real, server-persisted messaging (api/messages/*.js + Postgres) — this
// used to be an in-memory mock that reset on every reload. Every exported
// function here keeps the exact same name/signature/return shape the mock
// had, so MessagesContext.js and everything downstream (ChatPanel,
// BuyerDashboard, SellerDashboard, AdminPage, ItemViewPage) needed no changes.

async function parseErrorMessage(res, fallback) {
    try {
        const body = await res.json();
        return body?.error || fallback;
    } catch {
        return fallback;
    }
}

const fetchJson = async (url, options) => {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(await parseErrorMessage(res, 'Request failed'));
    return res.json();
};

export const fetchThreadsForUser = async () => fetchJson('/api/messages/list');

// Kept for API-compatibility with the old mock's signature; the server
// derives both from the session and the item, so these client-supplied
// values are unused now (sellerId/buyerId in particular were never safe to
// trust from the client anyway).
export const fetchSellerThreads = async () => fetchJson('/api/messages/list');
export const fetchBuyerThreads = async () => fetchJson('/api/messages/list');

export const getOrCreateThread = async ({ itemId }) => fetchJson('/api/messages/get-or-create-thread', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId }),
});

export const getOrCreateAdminThread = async (_adminId, targetUserId) => fetchJson('/api/messages/get-or-create-admin-thread', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUserId }),
});

export const sendMessage = async (threadId, _fromUserId, text) => {
    const thread = await fetchJson('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, text }),
    });
    // The mock returned { thread, message, emailEntry } — emailEntry was a
    // fake client-side log entry used to show a toast; email now genuinely
    // sends server-side, so there's nothing meaningful to show client-side.
    return { thread, message: thread.messages[thread.messages.length - 1], emailEntry: null };
};

export const markThreadRead = async (threadId, _role) => fetchJson('/api/messages/mark-read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ threadId }),
});
