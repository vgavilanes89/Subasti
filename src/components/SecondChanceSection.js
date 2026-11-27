import React, { useState, useEffect, useCallback } from 'react';
import { formatMoney, PLACEHOLDER_IMG } from './Shared';
import { fetchOffers, postOffer } from '../api/offers';
import { useRefreshOnNotification } from '../lib/useRefreshOnNotification';

// Seller: auctions that ended below the reserve. The seller may offer the item
// to the highest bidder once; the bidder has 48 hours to accept.
const SecondChanceSection = ({ loc }) => {
    const [rows, setRows] = useState([]);
    const [drafts, setDrafts] = useState({});
    const [busy, setBusy] = useState(null);
    const [error, setError] = useState('');

    const L = loc === 'en' ? {
        title: 'Auctions that missed your reserve',
        intro: 'No sale was made. You can offer the item to the highest bidder; they have 48 hours to accept.',
        highest: 'Highest bid',
        by: 'by',
        reserve: 'Your reserve',
        price: 'Offer price',
        send: 'Offer to highest bidder',
        sending: 'Sending…',
        pending: (a, d) => `Offer of ${a} sent. Waiting for the bidder until ${d}.`,
        accepted: (a) => `Accepted at ${a}. The order is in your sales, waiting for payment.`,
        declined: (a) => `The bidder declined your offer of ${a}.`,
        expired: (a) => `Your offer of ${a} expired without an answer.`,
        withdraw: 'Withdraw offer',
        errors: {
            AMOUNT_TOO_LOW: 'The offer cannot be lower than the highest bid.',
            ALREADY_OFFERED: 'You already made an offer for this auction.',
            ALREADY_SOLD: 'This item has already been sold.',
            REQUEST_FAILED: 'Something went wrong. Please try again.',
        },
    } : {
        title: 'Subastas que no alcanzaron tu reserva',
        intro: 'No hubo venta. Puedes ofrecer el artículo al mejor postor; tiene 48 horas para aceptar.',
        highest: 'Puja más alta',
        by: 'de',
        reserve: 'Tu reserva',
        price: 'Precio de la oferta',
        send: 'Ofrecer al mejor postor',
        sending: 'Enviando…',
        pending: (a, d) => `Oferta de ${a} enviada. Esperando respuesta hasta ${d}.`,
        accepted: (a) => `Aceptada por ${a}. El pedido está en tus ventas, esperando el pago.`,
        declined: (a) => `El postor rechazó tu oferta de ${a}.`,
        expired: (a) => `Tu oferta de ${a} venció sin respuesta.`,
        withdraw: 'Retirar oferta',
        errors: {
            AMOUNT_TOO_LOW: 'La oferta no puede ser menor que la puja más alta.',
            ALREADY_OFFERED: 'Ya hiciste una oferta para esta subasta.',
            ALREADY_SOLD: 'Este artículo ya se vendió.',
            REQUEST_FAILED: 'Algo salió mal. Inténtalo de nuevo.',
        },
    };

    const load = useCallback(() => { fetchOffers('seller').then(setRows).catch(() => {}); }, []);
    useEffect(() => { load(); }, [load]);
    useRefreshOnNotification(load);

    const act = async (key, body) => {
        setBusy(key);
        setError('');
        try {
            setRows(await postOffer(body));
        } catch (err) {
            setError(L.errors[err.message] || L.errors.REQUEST_FAILED);
            load();
        } finally {
            setBusy(null);
        }
    };

    if (rows.length === 0) return null;
    const fmtDate = (ts) => new Date(ts).toLocaleString(loc === 'en' ? 'en-US' : 'es-CR', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

    return (
        <div className="seller-section" id="second-chance">
            <h4>{L.title}</h4>
            <p className="text-sm text-gray-600 mb-3">{L.intro}</p>
            {error && <p className="text-sm text-red-600 mb-2" role="alert">{error}</p>}
            <div className="seller-orders-list">
                {rows.map(r => {
                    const money = (n) => formatMoney(n, loc, r.currency);
                    const offer = r.offer;
                    const canOffer = !offer || offer.status === 'withdrawn';
                    const draft = drafts[r.itemId] ?? String(r.highestBid);
                    return (
                        <div key={r.itemId} className="seller-order-card" data-item-id={r.itemId}>
                            <div className="seller-order-main">
                                <img src={r.image || PLACEHOLDER_IMG} alt="" />
                                <div className="seller-order-info">
                                    <p className="font-semibold text-gray-800">{r.title}</p>
                                    <p className="text-sm text-gray-600">
                                        {L.highest}: <strong>{money(r.highestBid)}</strong>{r.bidderName ? ` ${L.by} ${r.bidderName}` : ''} · {L.reserve}: {money(r.reservePrice)}
                                    </p>
                                    {offer && offer.status === 'pending' && <p className="text-sm text-purple-700 mt-1">{L.pending(money(offer.amount), fmtDate(offer.expiresAt))}</p>}
                                    {offer && ['accepted', 'declined', 'expired'].includes(offer.status) && <p className="text-sm text-gray-600 mt-1">{L[offer.status](money(offer.amount))}</p>}
                                </div>
                            </div>
                            <div className="seller-order-actions">
                                {canOffer && (
                                    <>
                                        <label className="text-xs text-gray-500">
                                            {L.price}
                                            <input
                                                type="number"
                                                min={r.highestBid}
                                                step={r.currency === 'USD' ? '0.01' : '1'}
                                                value={draft}
                                                onChange={(e) => setDrafts(d => ({ ...d, [r.itemId]: e.target.value }))}
                                                className="seller-input block w-32"
                                            />
                                        </label>
                                        <button type="button" className="seller-action-btn" disabled={busy === r.itemId} onClick={() => act(r.itemId, { action: 'create', itemId: r.itemId, amount: Number(draft) })}>
                                            {busy === r.itemId ? L.sending : L.send}
                                        </button>
                                    </>
                                )}
                                {offer && offer.status === 'pending' && (
                                    <button type="button" className="buyer-order-link-btn" disabled={busy === r.itemId} onClick={() => act(r.itemId, { action: 'withdraw', offerId: offer.id })}>{L.withdraw}</button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SecondChanceSection;
