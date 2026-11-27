// Why a seller can't edit or delete a listing, and what can go wrong trying.
const MESSAGES = {
    HAS_BIDS: {
        en: 'This auction has bids, so it can no longer be changed.',
        es: 'Esta subasta ya tiene ofertas, por lo que no se puede cambiar.',
    },
    HAS_WINNER: {
        en: 'This auction has a winner who still has to pay, so it can\'t be changed or deleted.',
        es: 'Esta subasta tiene un ganador que aún debe pagar, así que no se puede cambiar ni eliminar.',
    },
    OFFER_PENDING: {
        en: 'A second-chance offer is waiting for an answer. Withdraw it first.',
        es: 'Hay una oferta de segunda oportunidad esperando respuesta. Retírala primero.',
    },
    SOLD: {
        en: 'This item has been sold, so it can\'t be edited.',
        es: 'Este artículo ya se vendió, así que no se puede editar.',
    },
    NOT_FOUND: {
        en: 'We couldn\'t find that listing among yours.',
        es: 'No encontramos esa publicación entre las tuyas.',
    },
    LISTING_CHANGED: {
        en: 'Something changed on this listing just now (for example, a new bid). Reload and try again.',
        es: 'Algo cambió en esta publicación hace un momento (por ejemplo, una nueva oferta). Recarga e intenta de nuevo.',
    },
    DURATION_REQUIRED: {
        en: 'Choose how long the auction should run again.',
        es: 'Elige cuánto tiempo debe volver a durar la subasta.',
    },
    PAYMENT_METHOD_REQUIRED: {
        en: 'Select at least one accepted payment method.',
        es: 'Selecciona al menos un método de pago aceptado.',
    },
    IMAGES_REQUIRED: {
        en: 'Add at least one image.',
        es: 'Agrega al menos una imagen.',
    },
};

// '' for a code we have no wording for, so callers can fall back to their own.
export const listingErrorText = (code, loc) => MESSAGES[code]?.[loc === 'en' ? 'en' : 'es'] || '';
