const BRAND_NAMES = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    diners: 'Diners Club',
    jcb: 'JCB',
    unionpay: 'UnionPay',
};

export const cardBrandName = (brand) => BRAND_NAMES[brand] || 'Card';

// "88881234" -> "8888-1234"
export const formatSinpePhone = (phone) => (phone && phone.length === 8 ? `${phone.slice(0, 4)}-${phone.slice(4)}` : phone || '');
