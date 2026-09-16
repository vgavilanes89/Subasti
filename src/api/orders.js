async function parseErrorMessage(res, fallback) {
    try {
        const body = await res.json();
        return body?.error || fallback;
    } catch {
        return fallback;
    }
}

async function postAction(path, body) {
    const res = await fetch(`/api/orders/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
    });
    if (!res.ok) {
        throw new Error(await parseErrorMessage(res, 'REQUEST_FAILED'));
    }
    return res.json();
}

export const fetchSellerOrders = async () => {
    const res = await fetch('/api/orders/list?role=seller');
    if (!res.ok) throw new Error(await parseErrorMessage(res, 'REQUEST_FAILED'));
    return res.json();
};

export const fetchBuyerOrders = async () => {
    const res = await fetch('/api/orders/list?role=buyer');
    if (!res.ok) throw new Error(await parseErrorMessage(res, 'REQUEST_FAILED'));
    return res.json();
};

export const createCheckoutOrders = async ({ items, fulfillment, paymentMethod }) =>
    postAction('create', { items, fulfillment, paymentMethod });

export const payBuyerOrder = (orderId, paymentMethod = 'card') =>
    postAction('pay', { orderId, paymentMethod });

export const markOrderShipped = (orderId, { trackingNumber = '', shippingTimeframe = '' } = {}) =>
    postAction('ship', { orderId, trackingNumber, shippingTimeframe });

export const markOrderReadyForPickup = (orderId, { shippingTimeframe = '' } = {}) =>
    postAction('ready', { orderId, shippingTimeframe });

export const confirmOrderReceived = (orderId) => postAction('confirm', { orderId });

export const releaseFundsToSeller = (orderId) => postAction('release', { orderId });

export const submitBuyerClaim = (orderId, reason) => postAction('claim', { orderId, reason });

export const sellerCancelOrder = (orderId) => postAction('cancel', { orderId });

/** @deprecated use releaseFundsToSeller */
export const confirmOrderReceivedLegacy = confirmOrderReceived;
