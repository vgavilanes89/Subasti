// The ways a buyer can pay for an item. A seller chooses which of these they
// accept on each listing (at least one); checkout only offers a method that
// every item in the cart accepts.
export const PAYMENT_METHODS = ['card', 'sinpe'];

export const PAYMENT_METHOD_LABELS = {
    card: { en: 'Credit/Debit Card', es: 'Tarjeta de Crédito/Débito' },
    sinpe: { en: 'SINPE Móvil', es: 'SINPE Móvil' },
};

export const paymentMethodLabel = (method, loc) =>
    (PAYMENT_METHOD_LABELS[method] || {})[loc === 'en' ? 'en' : 'es'] || method;

// Valid, de-duplicated, in the canonical order. May be empty.
export const normalizePaymentMethods = (raw) => {
    if (!Array.isArray(raw)) return [];
    return PAYMENT_METHODS.filter((m) => raw.includes(m));
};

// What an item accepts. Items saved before this setting existed have no list,
// and were payable both ways, so they keep accepting both.
export const acceptedMethods = (item) => {
    const list = normalizePaymentMethods(item && item.paymentMethods);
    return list.length > 0 ? list : [...PAYMENT_METHODS];
};

export const itemAcceptsMethod = (item, method) => acceptedMethods(item).includes(method);

// Methods accepted by EVERY item in a cart.
export const commonPaymentMethods = (items) =>
    PAYMENT_METHODS.filter((m) => items.every((item) => itemAcceptsMethod(item, m)));
