// Saved addresses and saved payment methods for the signed-in buyer.

async function request(path, { method = 'GET', body } = {}) {
    const res = await fetch(path, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'REQUEST_FAILED');
    return data;
}

// Each address call answers with { addresses } — the full updated list.
export const fetchAddresses = () => request('/api/account/addresses');
export const createAddress = (address) => request('/api/account/addresses', { method: 'POST', body: address });
export const updateAddress = (address) => request('/api/account/addresses', { method: 'PUT', body: address });
export const setDefaultAddress = (id) => request('/api/account/addresses', { method: 'PATCH', body: { id } });
export const deleteAddress = (id) => request(`/api/account/addresses?id=${encodeURIComponent(id)}`, { method: 'DELETE' });

// Payment calls answer with { cards, sinpe, defaultPayment, cardsAvailable }.
export const fetchPaymentMethods = () => request('/api/account/payment-methods');
export const addSinpeNumber = ({ phone, alias, makeDefault }) =>
    request('/api/account/payment-methods', { method: 'POST', body: { phone, alias, makeDefault } });
export const setDefaultPayment = (type, id) =>
    request('/api/account/payment-methods', { method: 'PATCH', body: { type, id } });
export const deletePaymentMethod = (type, id) =>
    request(`/api/account/payment-methods?type=${type}&id=${encodeURIComponent(id)}`, { method: 'DELETE' });

// Starts saving a card: returns { clientSecret } for Stripe's SetupIntent.
export const createCardSetupIntent = () => request('/api/payments/setup-intent', { method: 'POST', body: {} });
