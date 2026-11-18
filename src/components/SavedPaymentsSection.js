import React, { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripePromise } from '../lib/stripe';
import * as walletApi from '../api/wallet';
import { cardBrandName, formatSinpePhone } from '../lib/walletFormat';

// Stripe's own form collects the card number inside an iframe — it never
// reaches our page or servers. On success Stripe attaches the card to this
// user's customer and we just reload the list.
const AddCardForm = ({ L, onSaved, onCancel }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements || saving) return;
        setSaving(true);
        setError('');
        const { error: stripeError } = await stripe.confirmSetup({ elements, redirect: 'if_required' });
        if (stripeError) {
            setError(stripeError.message || L.cardError);
            setSaving(false);
            return;
        }
        await onSaved();
        setSaving(false);
    };

    return (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-3 text-sm mt-3">
            <PaymentElement />
            {error && <p className="text-red-600">{error}</p>}
            <div className="flex gap-3">
                <button type="submit" disabled={!stripe || saving} className="seller-action-btn">{saving ? L.saving : L.saveCard}</button>
                <button type="button" onClick={onCancel} className="buyer-order-link-btn">{L.cancel}</button>
            </div>
            <p className="text-xs text-gray-500">{L.cardSecurity}</p>
        </form>
    );
};

const SavedPaymentsSection = ({ loc, wallet }) => {
    const { payments, setPayments, loading, refresh } = wallet;
    const { cards, sinpe, defaultPayment, cardsAvailable } = payments;

    const [setupSecret, setSetupSecret] = useState(null);
    const [startingCard, setStartingCard] = useState(false);
    const [cardStartError, setCardStartError] = useState('');
    const [sinpeForm, setSinpeForm] = useState(null); // null = closed
    const [savingSinpe, setSavingSinpe] = useState(false);
    const [sinpeError, setSinpeError] = useState('');
    const [busyId, setBusyId] = useState(null);

    const L = loc === 'en' ? {
        title: 'Saved payment methods',
        intro: 'Pick one at checkout without typing it again. Your default is selected automatically.',
        cardsHeading: 'Cards',
        noCards: 'No saved cards.',
        addCard: 'Add card',
        saveCard: 'Save card',
        saving: 'Saving…',
        cancel: 'Cancel',
        expires: 'Expires',
        cardSecurity: 'Your card details are entered in a secure form provided by Stripe and are never stored by Subasti.',
        cardError: 'We could not save this card. Please check it and try again.',
        cardsUnavailable: 'Saving cards is not available right now. Please try again later.',
        cardsListUnavailable: 'We could not load your saved cards right now.',
        sinpeHeading: 'SINPE Móvil numbers',
        sinpeIntro: 'The number you pay from. We pre-fill it at checkout so the transfer can be matched to you.',
        noSinpe: 'No saved numbers.',
        addSinpe: 'Add number',
        sinpePhone: 'SINPE Móvil number',
        sinpePhoneHelp: '8 digits, e.g. 8888-8888',
        alias: 'Label (optional)',
        aliasHelp: 'e.g. My phone',
        saveNumber: 'Save number',
        remove: 'Remove',
        confirmRemoveCard: 'Remove this card?',
        confirmRemoveNumber: 'Remove this number?',
        makeDefault: 'Make default',
        defaultBadge: 'Default',
        loading: 'Loading…',
        errors: {
            INVALID_SINPE_PHONE: 'Enter an 8-digit phone number.',
            TOO_MANY_NUMBERS: 'You can save up to 5 numbers. Remove one to add another.',
            REQUEST_FAILED: 'Could not save. Please try again.',
        },
    } : {
        title: 'Métodos de pago guardados',
        intro: 'Elige uno al pagar sin escribirlo de nuevo. Tu método predeterminado se selecciona solo.',
        cardsHeading: 'Tarjetas',
        noCards: 'No hay tarjetas guardadas.',
        addCard: 'Agregar tarjeta',
        saveCard: 'Guardar tarjeta',
        saving: 'Guardando…',
        cancel: 'Cancelar',
        expires: 'Vence',
        cardSecurity: 'Los datos de tu tarjeta se ingresan en un formulario seguro de Stripe y Subasti nunca los almacena.',
        cardError: 'No pudimos guardar esta tarjeta. Revísala e inténtalo de nuevo.',
        cardsUnavailable: 'Guardar tarjetas no está disponible por ahora. Inténtalo más tarde.',
        cardsListUnavailable: 'No pudimos cargar tus tarjetas guardadas en este momento.',
        sinpeHeading: 'Números de SINPE Móvil',
        sinpeIntro: 'El número desde el que pagas. Lo completamos al pagar para poder identificar tu transferencia.',
        noSinpe: 'No hay números guardados.',
        addSinpe: 'Agregar número',
        sinpePhone: 'Número de SINPE Móvil',
        sinpePhoneHelp: '8 dígitos, ej. 8888-8888',
        alias: 'Nombre (opcional)',
        aliasHelp: 'ej. Mi teléfono',
        saveNumber: 'Guardar número',
        remove: 'Eliminar',
        confirmRemoveCard: '¿Eliminar esta tarjeta?',
        confirmRemoveNumber: '¿Eliminar este número?',
        makeDefault: 'Hacer predeterminado',
        defaultBadge: 'Predeterminado',
        loading: 'Cargando…',
        errors: {
            INVALID_SINPE_PHONE: 'Escribe un número de 8 dígitos.',
            TOO_MANY_NUMBERS: 'Puedes guardar hasta 5 números. Elimina uno para agregar otro.',
            REQUEST_FAILED: 'No se pudo guardar. Inténtalo de nuevo.',
        },
    };

    const startAddCard = async () => {
        setStartingCard(true);
        setCardStartError('');
        try {
            const { clientSecret } = await walletApi.createCardSetupIntent();
            setSetupSecret(clientSecret);
        } catch {
            setCardStartError(L.cardsUnavailable);
        } finally {
            setStartingCard(false);
        }
    };

    const act = async (id, fn) => {
        setBusyId(id);
        try {
            setPayments(await fn());
        } catch {
            // list stays as it was; the user can retry
        } finally {
            setBusyId(null);
        }
    };

    const handleSaveSinpe = async (e) => {
        e.preventDefault();
        setSavingSinpe(true);
        setSinpeError('');
        try {
            setPayments(await walletApi.addSinpeNumber({ phone: sinpeForm.phone, alias: sinpeForm.alias }));
            setSinpeForm(null);
        } catch (err) {
            setSinpeError(L.errors[err.message] || L.errors.REQUEST_FAILED);
        } finally {
            setSavingSinpe(false);
        }
    };

    const stripeReady = Boolean(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

    return (
        <div className="seller-section" id="saved-payments">
            <h4>{L.title}</h4>
            <p className="text-sm text-gray-600 mb-3">{L.intro}</p>

            {loading ? (
                <p className="text-sm text-gray-500">{L.loading}</p>
            ) : (
                <>
                    <h5 className="wallet-subheading">{L.cardsHeading}</h5>
                    {!cardsAvailable && <p className="text-sm text-red-600 mb-2">{L.cardsListUnavailable}</p>}
                    {cards.length === 0 && !setupSecret && <p className="text-sm text-gray-500 mb-2">{L.noCards}</p>}
                    <div className="wallet-list">
                        {cards.map(c => {
                            const key = `card:${c.id}`;
                            const isDefault = defaultPayment === key;
                            return (
                                <div key={c.id} className={`wallet-item ${isDefault ? 'wallet-item--default' : ''}`}>
                                    <div className="wallet-item-main">
                                        <p className="font-semibold text-gray-800">
                                            {cardBrandName(c.brand)} •••• {c.last4}
                                            {isDefault && <span className="seller-badge seller-badge--ok ml-2">{L.defaultBadge}</span>}
                                        </p>
                                        {c.expMonth && <p className="text-sm text-gray-600">{L.expires} {String(c.expMonth).padStart(2, '0')}/{c.expYear}</p>}
                                    </div>
                                    <div className="wallet-item-actions">
                                        {!isDefault && (
                                            <button type="button" disabled={busyId === c.id} className="buyer-order-link-btn" onClick={() => act(c.id, () => walletApi.setDefaultPayment('card', c.id))}>{L.makeDefault}</button>
                                        )}
                                        <button
                                            type="button"
                                            disabled={busyId === c.id}
                                            className="buyer-order-link-btn"
                                            onClick={() => { if (window.confirm(L.confirmRemoveCard)) act(c.id, () => walletApi.deletePaymentMethod('card', c.id)); }}
                                        >{L.remove}</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {setupSecret ? (
                        <Elements stripe={getStripePromise()} options={{ clientSecret: setupSecret }}>
                            <AddCardForm
                                L={L}
                                onCancel={() => setSetupSecret(null)}
                                onSaved={async () => { setSetupSecret(null); await refresh(); }}
                            />
                        </Elements>
                    ) : (
                        <>
                            <button type="button" className="seller-action-btn mt-2" disabled={startingCard || !stripeReady} onClick={startAddCard}>
                                {startingCard ? L.saving : L.addCard}
                            </button>
                            {(cardStartError || !stripeReady) && <p className="text-sm text-red-600 mt-2">{cardStartError || L.cardsUnavailable}</p>}
                        </>
                    )}

                    <h5 className="wallet-subheading">{L.sinpeHeading}</h5>
                    <p className="text-sm text-gray-600 mb-2">{L.sinpeIntro}</p>
                    {sinpe.length === 0 && !sinpeForm && <p className="text-sm text-gray-500 mb-2">{L.noSinpe}</p>}
                    <div className="wallet-list">
                        {sinpe.map(s => {
                            const key = `sinpe:${s.id}`;
                            const isDefault = defaultPayment === key;
                            return (
                                <div key={s.id} className={`wallet-item ${isDefault ? 'wallet-item--default' : ''}`}>
                                    <div className="wallet-item-main">
                                        <p className="font-semibold text-gray-800 font-mono">
                                            {formatSinpePhone(s.phone)}
                                            {isDefault && <span className="seller-badge seller-badge--ok ml-2">{L.defaultBadge}</span>}
                                        </p>
                                        {s.alias && <p className="text-sm text-gray-600">{s.alias}</p>}
                                    </div>
                                    <div className="wallet-item-actions">
                                        {!isDefault && (
                                            <button type="button" disabled={busyId === s.id} className="buyer-order-link-btn" onClick={() => act(s.id, () => walletApi.setDefaultPayment('sinpe', s.id))}>{L.makeDefault}</button>
                                        )}
                                        <button
                                            type="button"
                                            disabled={busyId === s.id}
                                            className="buyer-order-link-btn"
                                            onClick={() => { if (window.confirm(L.confirmRemoveNumber)) act(s.id, () => walletApi.deletePaymentMethod('sinpe', s.id)); }}
                                        >{L.remove}</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {!sinpeForm && (
                        <button type="button" className="seller-action-btn mt-2" onClick={() => { setSinpeError(''); setSinpeForm({ phone: '', alias: '' }); }}>{L.addSinpe}</button>
                    )}
                    {sinpeForm && (
                        <form onSubmit={handleSaveSinpe} className="border rounded-lg p-4 space-y-3 text-sm mt-2">
                            <div className="wallet-form-grid">
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">{L.sinpePhone}</label>
                                    <input type="tel" value={sinpeForm.phone} onChange={e => setSinpeForm(f => ({ ...f, phone: e.target.value }))} className="seller-input w-full font-mono" maxLength={12} required autoComplete="tel-national" />
                                    <p className="text-xs text-gray-500 mt-1">{L.sinpePhoneHelp}</p>
                                </div>
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">{L.alias}</label>
                                    <input type="text" value={sinpeForm.alias} onChange={e => setSinpeForm(f => ({ ...f, alias: e.target.value }))} className="seller-input w-full" maxLength={40} placeholder={L.aliasHelp} />
                                </div>
                            </div>
                            {sinpeError && <p className="text-red-600">{sinpeError}</p>}
                            <div className="flex gap-3">
                                <button type="submit" disabled={savingSinpe} className="seller-action-btn">{savingSinpe ? L.saving : L.saveNumber}</button>
                                <button type="button" onClick={() => setSinpeForm(null)} className="buyer-order-link-btn">{L.cancel}</button>
                            </div>
                        </form>
                    )}
                </>
            )}
        </div>
    );
};

export default SavedPaymentsSection;
