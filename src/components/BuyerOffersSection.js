import React, { useState, useEffect, useCallback } from 'react';
import { formatMoney, PLACEHOLDER_IMG } from './Shared';
import { fetchOffers, postOffer } from '../api/offers';
import { useRefreshOnNotification } from '../lib/useRefreshOnNotification';
import { EMAIL_NOT_CONFIRMED, emailNeededText } from '../data/emailConfirm';

// Buyer: second-chance offers waiting for an answer (the seller's offer after an
// auction ended below its reserve).
const BuyerOffersSection = ({ loc, onAccepted }) => {
    const [offers, setOffers] = useState([]);
    const [choice, setChoice] = useState({});
    const [busy, setBusy] = useState(null);
    const [error, setError] = useState('');

    const L = loc === 'en' ? {
        title: 'Offers for you',
        intro: 'You were the highest bidder but the reserve was not reached. The seller is offering you the item.',
        price: 'Offered price',
        plus: 'shipping',
        until: 'Answer by',
        ship: 'Ship to me',
        pickup: 'Local pickup',
        accept: 'Accept offer',
        decline: 'Decline',
        working: 'Working…',
        confirmAccept: (a) => `Accept the offer of ${a}? You will have 48 hours to pay.`,
        accepted: 'Accepted. Complete your payment under "Payment required".',
        errors: { OFFER_CLOSED: 'This offer is no longer open.', ALREADY_SOLD: 'This item has already been sold.', REQUEST_FAILED: 'Something went wrong. Please try again.' },
    } : {
        title: 'Ofertas para ti',
        intro: 'Fuiste el mejor postor pero no se alcanzó la reserva. El vendedor te ofrece el artículo.',
        price: 'Precio ofrecido',
        plus: 'envío',
        until: 'Responde antes de',
        ship: 'Enviármelo',
        pickup: 'Recogida local',
        accept: 'Aceptar oferta',
        decline: 'Rechazar',
        working: 'Procesando…',
        confirmAccept: (a) => `¿Aceptar la oferta de ${a}? Tendrás 48 horas para pagar.`,
        accepted: 'Aceptada. Completa el pago en "Pago requerido".',
        errors: { OFFER_CLOSED: 'Esta oferta ya no está disponible.', ALREADY_SOLD: 'Este artículo ya se vendió.', REQUEST_FAILED: 'Algo salió mal. Inténtalo de nuevo.' },
    };

    const load = useCallback(() => { fetchOffers('buyer').then(setOffers).catch(() => {}); }, []);
    useEffect(() => { load(); }, [load]);
    useRefreshOnNotification(load);

    const act = async (offer, action, fulfillment) => {
        setBusy(offer.id);
        setError('');
        try {
            const result = await postOffer({ action, offerId: offer.id, fulfillment });
            setOffers(result.offers);
            if (action === 'accept') {
                alert(L.accepted);
                onAccepted?.();
            }
        } catch (err) {
            setError(err.message === EMAIL_NOT_CONFIRMED ? emailNeededText(loc) : (L.errors[err.message] || L.errors.REQUEST_FAILED));
            load();
        } finally {
            setBusy(null);
        }
    };

    if (offers.length === 0 && !error) return null;
    const fmtDate = (ts) => new Date(ts).toLocaleString(loc === 'en' ? 'en-US' : 'es-CR', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

    return (
        <div className="seller-section" id="buyer-offers">
            <h4>{L.title}</h4>
            <p className="text-sm text-gray-600 mb-3">{L.intro}</p>
            {error && <p className="text-sm text-red-600 mb-2" role="alert">{error}</p>}
            <div className="seller-orders-list">
                {offers.map(o => {
                    const money = (n) => formatMoney(n, loc, o.currency);
                    const fulfillment = choice[o.id] || (o.shippingShip ? 'ship' : 'pickup');
                    return (
                        <div key={o.id} className="seller-order-card buyer-order-card" data-offer-id={o.id}>
                            <div className="seller-order-main">
                                <img src={o.image || PLACEHOLDER_IMG} alt="" />
                                <div className="seller-order-info">
                                    <p className="font-semibold text-gray-800">{o.title}</p>
                                    <p className="text-sm text-gray-700">
                                        {L.price}: <strong>{money(o.amount)}</strong>
                                        {fulfillment === 'ship' && o.shippingCost > 0 ? ` + ${money(o.shippingCost)} ${L.plus}` : ''}
                                    </p>
                                    <p className="text-xs text-gray-500">{L.until} {fmtDate(o.expiresAt)}</p>
                                    {o.shippingShip && o.shippingLocal && (
                                        <select value={fulfillment} onChange={(e) => setChoice(c => ({ ...c, [o.id]: e.target.value }))} className="seller-input mt-1">
                                            <option value="ship">{L.ship}</option>
                                            <option value="pickup">{L.pickup}</option>
                                        </select>
                                    )}
                                </div>
                            </div>
                            <div className="bid-row-actions">
                                <button type="button" className="seller-action-btn" disabled={busy === o.id} onClick={() => { if (window.confirm(L.confirmAccept(money(o.amount)))) act(o, 'accept', fulfillment); }}>
                                    {busy === o.id ? L.working : L.accept}
                                </button>
                                <button type="button" className="buyer-order-link-btn" disabled={busy === o.id} onClick={() => act(o, 'decline')}>{L.decline}</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BuyerOffersSection;
