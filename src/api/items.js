export { getBidIncrement, getMinBid } from '../lib/bidding';

async function parseErrorMessage(res, fallback) {
    try {
        const body = await res.json();
        return body?.error || fallback;
    } catch {
        return fallback;
    }
}

export const fetchItems = async () => {
    const res = await fetch('/api/items/list');
    if (!res.ok) throw new Error('Could not load items');
    return res.json();
};

export const fetchItem = async (id) => {
    const res = await fetch(`/api/items/get?id=${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Could not load item');
    return res.json();
};

export const createItem = async (item) => {
    const res = await fetch('/api/items/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error(await parseErrorMessage(res, 'Could not create item'));
    return res.json();
};

export const deleteItem = async (id) => {
    const res = await fetch('/api/items/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error(await parseErrorMessage(res, 'Could not delete item'));
    return id;
};

// bidderId is accepted for backward compatibility with existing call sites,
// but the server derives the real bidder from the session — never trusted
// from the client.
export const placeBid = async (id, amount) => {
    const res = await fetch('/api/items/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: id, amount }),
    });
    if (!res.ok) throw new Error(await parseErrorMessage(res, 'Could not place bid'));
    return res.json();
};
