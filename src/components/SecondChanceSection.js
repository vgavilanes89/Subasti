import React, { useState, useEffect, useCallback } from 'react';
import { formatMoney, PLACEHOLDER_IMG } from './Shared';
import { fetchOffers, postOffer } from '../api/offers';
import { useRefreshOnNotification } from '../lib/useRefreshOnNotification';
import { EMAIL_NOT_CONFIRMED, emailNeededText } from '../data/emailConfirm';

// Seller: auctions that ended without a sale, either below the reserve or with a
// winner whose account was suspended. The seller may offer the item once, to the
// highest (or next highest) bidder, who has 48 hours to accept.
const SecondChanceSection = ({ loc }) => {
    const [rows, setRows] = useState([]);
    const [drafts, setDrafts] = useState({});
    const [busy, setBusy] = useState(null);
    const [error, setError] = useState('');

    const L = loc === 'en' ? {
        title: 'Auctions without a sale',
        intro: 'You can offer each item to a bidder; they have 48 hours to accept.',
        highest: 'Highest bid',
        next: 'Next highest bid',
        winnerGone: 'The winner is no longer available.',
        sendNext: 'Offer to next bidder',
        by: 'by',
        reserve: 'Your reserve',
        price: 'Offer price',
        send: 'Offer to highest bidder',
        sending: 'Sending…',
        pending: (a, d) => `Offer of ${a} sent. Waiting for the bidder until ${d}.`,
        accepted: (a) => `Accepted at ${a}. See your sales below for the order.`,
        declined: (a) => `The bidder declined your offer of ${a}.`,
        expired: (a) => `Your offer of ${a} expired without an answer.`,
        withdraw: 'Withdraw offer',
        errors: {
            AMOUNT_TOO_LOW: 'The offer cannot be lower than their bid.',
            ALREADY_OFFERED: 'You already made an offer for this auction.',
            ALREADY_SOLD: 'This item has already been sold.',
            REQUEST_FAILED: 'Something went wrong. Please try again.',
        },
    } : {
        title: 'Subastas sin venta',
        intro: 'Puedes ofrecer cada artículo a un postor; tiene 48 horas para aceptar.',
        highest: 'Puja más alta',
        next: 'Siguiente puja más alta',
        winnerGone: 'El ganador ya no está disponible.',
        sendNext: 'Ofrecer al siguiente postor',
        by: 'de',
        reserve: 'Tu reserva',
        price: 'Precio de la oferta',
        send: 'Ofrecer al mejor postor',
        sending: 'Enviando…',
        pending: (a, d) => `Oferta de ${a} enviada. Esperando respuesta hasta ${d}.`,
        accepted: (a) => `Aceptada por ${a}. Mira el pedido en tus ventas, abajo.`,
        declined: (a) => `El postor rechazó tu oferta de ${a}.`,
        expired: (a) => `Tu oferta de ${a} venció sin respuesta.`,
        withdraw: 'Retirar oferta',
        errors: {
            AMOUNT_TOO_LOW: 'La oferta no puede ser menor que su puja.',
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
            setError(err.message === EMAIL_NOT_CONFIRMED ? emailNeededText(loc) : (L.errors[err.message] || L.errors.REQUEST_FAILED));
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
                                    {r.reason === 'winner_unavailable' && <p className="text-sm text-amber-700">{L.winnerGone}</p>}
                                    <p className="text-sm text-gray-600">
                                        {r.reason === 'winner_unavailable' ? L.next : L.highest}: <strong>{money(r.highestBid)}</strong>{r.bidderName ? ` ${L.by} ${r.bidderName}` : ''}
                                        {r.reservePrice !== null && <> · {L.reserve}: {money(r.reservePrice)}</>}
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
                                            {busy === r.itemId ? L.sending : (r.reason === 'winner_unavailable' ? L.sendNext : L.send)}
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
