import React, { useEffect, useRef, useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripePromise } from '../lib/stripe';
import { formatMoney } from './Shared';
import SinpePaymentPanel from './SinpePaymentPanel';
import * as walletApi from '../api/wallet';
import { cardBrandName } from '../lib/walletFormat';
import { PAYMENT_METHODS } from '../data/paymentMethods';
import { EMAIL_NOT_CONFIRMED, emailNeededText } from '../data/emailConfirm';

// Why the server wouldn't start a card payment.
const intentError = async (res) => new Error((await res.json().catch(() => ({}))).error || 'CREATE_INTENT_FAILED');

async function waitForPaidOrder(paymentIntentId, attempts = 8, delayMs = 800) {
    for (let i = 0; i < attempts; i++) {
        const res = await fetch(`/api/payments/status?paymentIntentId=${encodeURIComponent(paymentIntentId)}`);
        if (res.ok) {
            const body = await res.json();
            if (body.ready && body.orders[0]) return body.orders[0];
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    return null;
}

const SavedCardPayForm = ({ order, L, cardId, onPaid, onClose }) => {
    const stripe = useStripe();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handlePay = async () => {
        if (!stripe || submitting) return;
        setSubmitting(true);
        setError('');
        try {
            const res = await fetch('/api/payments/create-intent-for-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: order.id, paymentMethodId: cardId }),
            });
            if (!res.ok) throw await intentError(res);
            const { clientSecret } = await res.json();
            const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, { payment_method: cardId });
            if (confirmError) {
                setError(confirmError.message || L.payError);
                return;
            }
            if (paymentIntent && paymentIntent.status === 'succeeded') {
                const updated = await waitForPaidOrder(paymentIntent.id);
                onPaid(updated || { ...order, status: 'escrow_held' });
            }
        } catch (err) {
            setError(err.message === EMAIL_NOT_CONFIRMED ? L.emailNeeded : L.payError);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-3">
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border font-semibold text-gray-600">
                    {L.cancel}
                </button>
                <button
                    type="button"
                    onClick={handlePay}
                    disabled={submitting || !stripe}
                    className="flex-1 py-2 rounded-lg bg-purple-600 text-white font-semibold disabled:opacity-60"
                >
                    {submitting ? L.placing : L.confirmPay}
                </button>
            </div>
        </div>
    );
};

const CardPaymentForm = ({ order, loc, L, onPaid, onClose }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleConfirm = async () => {
        if (!stripe || !elements || submitting) return;
        setSubmitting(true);
        setError('');
        try {
            const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
                elements,
                redirect: 'if_required',
                confirmParams: { return_url: window.location.href.split('?')[0] },
            });
            if (confirmError) {
                setError(confirmError.message || L.payError);
                return;
            }
            if (paymentIntent && paymentIntent.status === 'succeeded') {
                const updated = await waitForPaidOrder(paymentIntent.id);
                onPaid(updated || { ...order, status: 'escrow_held' });
            }
        } catch {
            setError(L.payError);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            <PaymentElement />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border font-semibold text-gray-600">
                    {L.cancel}
                </button>
                <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="flex-1 py-2 rounded-lg bg-purple-600 text-white font-semibold disabled:opacity-60"
                >
                    {submitting ? L.placing : L.confirmPay}
                </button>
            </div>
        </div>
    );
};

// `methods`: the payment methods the seller accepts for this item.
const PayOrderModal = ({ order, loc, onClose, onPaid, onReported, methods = PAYMENT_METHODS }) => {
    const [tab, setTab] = useState(methods[0] || 'card');
    const [clientSecret, setClientSecret] = useState(null);
    const [error, setError] = useState('');
    const fetchedIntent = useRef(false);
    const [savedCards, setSavedCards] = useState([]);
    const [selectedCardId, setSelectedCardId] = useState(null); // null = a new card
    const [savedSinpe, setSavedSinpe] = useState([]);
    const [sinpePhone, setSinpePhone] = useState('');

    // Offer the buyer's saved cards and SINPE number, defaulting to their preferred one.
    useEffect(() => {
        let cancelled = false;
        walletApi.fetchPaymentMethods().then((p) => {
            if (cancelled) return;
            setSavedCards(p.cards || []);
            setSavedSinpe(p.sinpe || []);
            const def = p.defaultPayment || '';
            const card = (p.cards || []).find(c => def === `card:${c.id}`) || (p.cards || [])[0];
            if (card) setSelectedCardId(card.id);
            const num = (p.sinpe || []).find(n => def === `sinpe:${n.id}`) || (p.sinpe || [])[0];
            if (num) setSinpePhone(num.phone);
        }).catch(() => {});
        return () => { cancelled = true; };
    }, []);

    const total = order.amount + (order.shippingCost || 0);

    const L = loc === 'en' ? {
        title: 'Complete Payment',
        card: 'Credit/Debit Card',
        sinpe: 'SINPE Móvil',
        cancel: 'Cancel',
        confirmPay: 'Confirm Payment',
        placing: 'Processing…',
        payError: 'Payment failed. Please try again.',
        sinpeInstructions: 'Please transfer the total amount to the following number using SINPE Móvil. Use your Order ID as the transfer description.',
        sinpeConfirm: 'I already transferred it',
        savedCards: 'Your saved cards',
        useNewCard: 'Use a different card',
        expires: 'exp',
        sinpeFrom: 'Your SINPE Móvil number (the number you pay from)',
        sinpePhoneRequired: 'Enter the 8-digit SINPE Móvil number you are paying from.',
        total: 'Total',
        emailNeeded: emailNeededText('en'),
    } : {
        title: 'Completar Pago',
        card: 'Tarjeta de Crédito/Débito',
        sinpe: 'SINPE Móvil',
        cancel: 'Cancelar',
        confirmPay: 'Confirmar Pago',
        placing: 'Procesando…',
        payError: 'El pago falló. Intente de nuevo.',
        sinpeInstructions: 'Por favor, transfiera el monto total al siguiente número usando SINPE Móvil. Use el ID de su orden como descripción de la transferencia.',
        sinpeConfirm: 'Ya lo transferí',
        savedCards: 'Tus tarjetas guardadas',
        useNewCard: 'Usar otra tarjeta',
        expires: 'vence',
        sinpeFrom: 'Tu número de SINPE Móvil (el número desde el que pagas)',
        sinpePhoneRequired: 'Escribe el número de SINPE Móvil de 8 dígitos desde el que pagas.',
        total: 'Total',
        emailNeeded: emailNeededText('es'),
    };

    useEffect(() => {
        // No cleanup/cancellation flag here on purpose: fetchedIntent already
        // guarantees this fetch fires at most once per instance (immune to
        // StrictMode's intentional double-invoke), and a stray setState after
        // a real unmount is a harmless no-op in React 18. A cancelled-flag
        // pattern here actively breaks things: StrictMode's mount->cleanup->
        // remount cycle would flip "cancelled" true on the one closure whose
        // fetch is actually in flight (since the ref guard skips a second
        // one), discarding its result when it resolves.
        if (tab !== 'card' || fetchedIntent.current) return;
        fetchedIntent.current = true;
        fetch('/api/payments/create-intent-for-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: order.id }),
        })
            .then(async (res) => {
                if (!res.ok) throw await intentError(res);
                return res.json();
            })
            .then((body) => setClientSecret(body.clientSecret))
            .catch((err) => setError(err.message === EMAIL_NOT_CONFIRMED ? L.emailNeeded : L.payError));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    return (
        <div className="pay-order-modal-overlay" onClick={onClose}>
            <div className="pay-order-modal" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-800">{L.title}</h3>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label={L.cancel}>×</button>
                </div>
                <p className="text-sm text-gray-600 mb-1">{order.itemTitle}</p>
                <p className="text-xl font-bold text-gray-800 mb-4">{L.total}: {formatMoney(total, loc, order.currency)}</p>

                <div className="flex border-b mb-4">
                    {methods.map((method) => (
                        <button
                            key={method}
                            type="button"
                            onClick={() => setTab(method)}
                            className={`py-2 px-4 font-semibold ${tab === method ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}
                        >
                            {method === 'card' ? L.card : L.sinpe}
                        </button>
                    ))}
                </div>

                {error && <p className="text-sm text-red-500 mb-2">{error}</p>}

                {tab === 'card' && savedCards.length > 0 && (
                    <div className="space-y-2 mb-4">
                        <p className="text-sm font-semibold text-gray-700">{L.savedCards}</p>
                        {savedCards.map(c => (
                            <label key={c.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <input type="radio" name="payOrderCard" checked={selectedCardId === c.id} onChange={() => setSelectedCardId(c.id)} className="h-4 w-4" />
                                <span className="ml-3 font-semibold">{cardBrandName(c.brand)} •••• {c.last4}</span>
                                {c.expMonth && <span className="ml-2 text-sm text-gray-500">{L.expires} {String(c.expMonth).padStart(2, '0')}/{String(c.expYear).slice(-2)}</span>}
                            </label>
                        ))}
                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="radio" name="payOrderCard" checked={selectedCardId === null} onChange={() => setSelectedCardId(null)} className="h-4 w-4" />
                            <span className="ml-3 font-semibold">{L.useNewCard}</span>
                        </label>
                    </div>
                )}

                {tab === 'card' && selectedCardId && (
                    <Elements stripe={getStripePromise()}>
                        <SavedCardPayForm order={order} L={L} cardId={selectedCardId} onPaid={onPaid} onClose={onClose} />
                    </Elements>
                )}

                {tab === 'card' && !selectedCardId && (
                    clientSecret ? (
                        <Elements stripe={getStripePromise()} options={{ clientSecret }}>
                            <CardPaymentForm order={order} loc={loc} L={L} onPaid={onPaid} onClose={onClose} />
                        </Elements>
                    ) : (
                        <p className="text-sm text-gray-500">{L.placing}</p>
                    )
                )}

                {tab === 'sinpe' && (
                    <SinpePaymentPanel
                        key={savedSinpe.length}
                        loc={loc}
                        target={{ orderId: order.id }}
                        defaultPhone={sinpePhone}
                        savedNumbers={savedSinpe}
                        onReported={onReported}
                        onClose={onClose}
                        closeLabel={L.cancel}
                    />
                )}
            </div>
        </div>
    );
};

export default PayOrderModal;
