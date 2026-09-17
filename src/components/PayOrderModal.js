import React, { useEffect, useRef, useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripePromise } from '../lib/stripe';
import { formatMoney } from './Shared';
import { payBuyerOrder } from '../api/orders';

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

const PayOrderModal = ({ order, loc, onClose, onPaid }) => {
    const [tab, setTab] = useState('card');
    const [clientSecret, setClientSecret] = useState(null);
    const [error, setError] = useState('');
    const [sinpeSubmitting, setSinpeSubmitting] = useState(false);
    const fetchedIntent = useRef(false);

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
        total: 'Total',
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
        total: 'Total',
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
                if (!res.ok) throw new Error('CREATE_INTENT_FAILED');
                return res.json();
            })
            .then((body) => setClientSecret(body.clientSecret))
            .catch(() => setError(L.payError));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    const handleSinpeConfirm = async () => {
        setSinpeSubmitting(true);
        try {
            const updated = await payBuyerOrder(order.id, 'sinpe');
            onPaid(updated);
        } catch {
            setError(L.payError);
        } finally {
            setSinpeSubmitting(false);
        }
    };

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
                    <button
                        type="button"
                        onClick={() => setTab('card')}
                        className={`py-2 px-4 font-semibold ${tab === 'card' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}
                    >
                        {L.card}
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('sinpe')}
                        className={`py-2 px-4 font-semibold ${tab === 'sinpe' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}
                    >
                        {L.sinpe}
                    </button>
                </div>

                {error && <p className="text-sm text-red-500 mb-2">{error}</p>}

                {tab === 'card' && (
                    clientSecret ? (
                        <Elements stripe={getStripePromise()} options={{ clientSecret }}>
                            <CardPaymentForm order={order} loc={loc} L={L} onPaid={onPaid} onClose={onClose} />
                        </Elements>
                    ) : (
                        <p className="text-sm text-gray-500">{L.placing}</p>
                    )
                )}

                {tab === 'sinpe' && (
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-gray-600">{L.sinpeInstructions}</p>
                            <p className="text-2xl font-bold text-gray-800 my-2">8888-8888</p>
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border font-semibold text-gray-600">
                                {L.cancel}
                            </button>
                            <button
                                type="button"
                                onClick={handleSinpeConfirm}
                                disabled={sinpeSubmitting}
                                className="flex-1 py-2 rounded-lg bg-purple-600 text-white font-semibold disabled:opacity-60"
                            >
                                {sinpeSubmitting ? L.placing : L.sinpeConfirm}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PayOrderModal;
