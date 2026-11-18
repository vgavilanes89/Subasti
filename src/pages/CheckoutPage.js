import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useItems } from '../context/ItemsContext';
import { COSTA_RICA_LOCATIONS } from '../data/Constants';
import { CRC, itemCurrency, formatMoneyTotals } from '../components/Shared';
import EscrowPanel from '../components/EscrowPanel';
import { createCheckoutOrders, fetchSinpeAvailability } from '../api/orders';
import SinpePaymentPanel from '../components/SinpePaymentPanel';
import * as walletApi from '../api/wallet';
import { useWallet } from '../lib/useWallet';
import { cardBrandName, formatSinpePhone } from '../lib/walletFormat';
import { getStripePromise } from '../lib/stripe';
import { commonPaymentMethods, acceptedMethods, paymentMethodLabel } from '../data/paymentMethods';

async function waitForOrders(paymentIntentId, attempts = 8, delayMs = 800) {
    for (let i = 0; i < attempts; i++) {
        const res = await fetch(`/api/payments/status?paymentIntentId=${encodeURIComponent(paymentIntentId)}`);
        if (res.ok) {
            const body = await res.json();
            if (body.ready) return true;
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    return false;
}

const CheckoutPage = ({ loc }) => {
    const { user } = useAuth();
    const { cart, clearCart } = useCart();
    const { items } = useItems();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const cartWithDetails = useMemo(() => cart.map(cartItem => ({ ...cartItem, ...items.find(item => item.id === cartItem.id) })), [cart, items]);

    const L = loc === 'en' ? {
        title: 'Checkout',
        deliveryMethod: 'Delivery Method',
        shipToAddress: 'Ship to Address',
        localPickup: 'Local Pickup',
        pickupInstructions: 'You will coordinate pickup details with the seller after purchase.',
        shippingInfo: 'Shipping Information',
        paymentInfo: 'Payment Information',
        orderSummary: 'Order Summary',
        fullName: 'Full Name',
        address: 'Address',
        city: 'City',
        country: 'Country',
        postalCode: 'Postal Code',
        placeOrder: 'Place Order',
        subtotal: 'Subtotal',
        shipping: 'Shipping',
        total: 'Total',
        free: 'Free',
        card: 'Credit/Debit Card',
        sinpe: 'SINPE Móvil',
        sinpeInstructions: 'Please transfer the total amount to the following number using SINPE Móvil. Use your Order ID as the transfer description.',
        useDefaultAddress: 'Use default address:',
        useDefaultPayment: 'Use default payment:',
        useThis: 'Use this',
        newAddress: 'Use a new address',
        saveAddress: 'Save this address for future use',
        province: 'Province',
        standardShipping: 'Standard Shipping',
        collectFromSeller: 'Collect from seller',
        addressAlias: 'Address',
        savedCards: 'Your saved cards',
        useNewCard: 'Use a different card',
        saveCardForLater: 'Save this card for next time',
        expires: 'exp',
        sinpeFrom: 'Your SINPE Móvil number (the number you pay from)',
        sinpeFromHelp: 'So we can match your transfer to this order.',
        saveSinpeNumber: 'Save this number for next time',
        sinpePhoneRequired: 'Enter the 8-digit SINPE Móvil number you will pay from.',
        defaultTag: 'Default',
        sinpeCheckoutNote: 'After you place the order you will see the SINPE Móvil number of Subasti and your payment reference. Your order is paid once Subasti confirms the transfer.',
        payLater: 'Pay later — go to my orders',
        escrowNote: 'Your payment is held securely by Subasti until you receive the item and confirm satisfaction (or 48 hours pass).',
        orderSuccess: 'Payment secured in Subasti escrow. Track your order in Buying.',
        placing: 'Securing payment…',
        noCommonPayment: "These items can't be paid for together: the sellers accept different payment methods. Buy them in separate orders.",
        acceptsLabel: 'Accepts',
        mixedCurrency: 'Your cart mixes CRC and USD items. Card payment supports one currency per order — remove items so only one currency remains, or pay with SINPE Móvil.',
        cardUnavailable: 'Card payment is unavailable right now.',
        confirming: 'Confirming your payment…',
    } : {
        title: 'Finalizar Compra',
        deliveryMethod: 'Método de Entrega',
        shipToAddress: 'Enviar a Dirección',
        localPickup: 'Recogida Local',
        pickupInstructions: 'Coordinarás los detalles de la recogida con el vendedor después de la compra.',
        shippingInfo: 'Información de Envío',
        paymentInfo: 'Información de Pago',
        orderSummary: 'Resumen de la Orden',
        fullName: 'Nombre Completo',
        address: 'Dirección',
        city: 'Ciudad',
        country: 'País',
        postalCode: 'Código Postal',
        placeOrder: 'Realizar Pedido',
        subtotal: 'Subtotal',
        shipping: 'Envío',
        total: 'Total',
        free: 'Gratis',
        card: 'Tarjeta de Crédito/Débito',
        sinpe: 'SINPE Móvil',
        sinpeInstructions: 'Por favor, transfiera el monto total al siguiente número usando SINPE Móvil. Use el ID de su orden como descripción de la transferencia.',
        useDefaultAddress: 'Usar dirección predeterminada:',
        useDefaultPayment: 'Usar método de pago predeterminado:',
        useThis: 'Usar este',
        newAddress: 'Usar una nueva dirección',
        saveAddress: 'Guardar esta dirección para uso futuro',
        province: 'Provincia',
        standardShipping: 'Envío Estándar',
        collectFromSeller: 'Recoger del vendedor',
        addressAlias: 'Dirección',
        savedCards: 'Tus tarjetas guardadas',
        useNewCard: 'Usar otra tarjeta',
        saveCardForLater: 'Guardar esta tarjeta para la próxima vez',
        expires: 'vence',
        sinpeFrom: 'Tu número de SINPE Móvil (el número desde el que pagas)',
        sinpeFromHelp: 'Para identificar tu transferencia con este pedido.',
        saveSinpeNumber: 'Guardar este número para la próxima vez',
        sinpePhoneRequired: 'Escribe el número de SINPE Móvil de 8 dígitos desde el que pagarás.',
        defaultTag: 'Predeterminada',
        sinpeCheckoutNote: 'Al hacer el pedido verás el número de SINPE Móvil de Subasti y tu referencia de pago. Tu pedido se considera pagado cuando Subasti confirma la transferencia.',
        payLater: 'Pagar después — ir a mis pedidos',
        escrowNote: 'Su pago queda retenido de forma segura por Subasti hasta que reciba el artículo y confirme conformidad (o pasen 48 horas).',
        orderSuccess: 'Pago asegurado en depósito Subasti. Rastree su pedido en Compras.',
        placing: 'Asegurando pago…',
        noCommonPayment: 'Estos artículos no se pueden pagar juntos: los vendedores aceptan métodos de pago distintos. Cómpralos en pedidos separados.',
        acceptsLabel: 'Acepta',
        mixedCurrency: 'Su carrito mezcla artículos en CRC y USD. El pago con tarjeta admite una sola moneda por orden — elimine artículos hasta dejar una sola moneda, o pague con SINPE Móvil.',
        cardUnavailable: 'El pago con tarjeta no está disponible en este momento.',
        confirming: 'Confirmando su pago…',
    };

    const isShippingAvailable = useMemo(() => cartWithDetails.every(item => item.shippingShip), [cartWithDetails]);
    const isPickupAvailable = useMemo(() => cartWithDetails.every(item => item.shippingLocal), [cartWithDetails]);

    const [deliveryMethod, setDeliveryMethod] = useState(isShippingAvailable ? 'ship' : 'pickup');

    const wallet = useWallet(user);
    const [selectedAddressId, setSelectedAddressId] = useState('new');
    const [saveNewAddress, setSaveNewAddress] = useState(true);
    const addressTouched = useRef(false);

    const blankAddress = () => ({ fullName: user?.realName || '', address: '', city: '', province: '', postalCode: '', country: 'Costa Rica' });
    const [shippingData, setShippingData] = useState(blankAddress);

    const applySavedAddress = (a) => {
        setSelectedAddressId(a.id);
        setShippingData({
            fullName: a.fullName || user?.realName || '',
            address: a.address,
            city: a.city,
            province: a.province,
            postalCode: a.postalCode,
            country: a.country || 'Costa Rica',
        });
    };

    // Once the saved addresses load, start with the default one (unless the
    // shopper already picked something).
    useEffect(() => {
        if (addressTouched.current || wallet.addresses.length === 0) return;
        applySavedAddress(wallet.addresses.find(a => a.isDefault) || wallet.addresses[0]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wallet.addresses]);

    const [paymentMethod, setPaymentMethod] = useState('card');
    const [selectedCardId, setSelectedCardId] = useState(null); // null = a new card
    const [saveCard, setSaveCard] = useState(false);
    const [sinpePhone, setSinpePhone] = useState('');
    const [saveSinpe, setSaveSinpe] = useState(true);
    // Set once a SINPE order is placed: shows the payment instructions.
    const [sinpeCheckout, setSinpeCheckout] = useState(null);
    const paymentPrefilled = useRef(false);
    const [placing, setPlacing] = useState(false);
    const [resumingRedirect, setResumingRedirect] = useState(() => searchParams.get('redirect_status') === 'succeeded');

    const handleAddressSelection = (addressId) => {
        addressTouched.current = true;
        if (addressId === 'new') {
            setSelectedAddressId('new');
            setShippingData(blankAddress());
        } else {
            const selected = wallet.addresses.find(addr => addr.id === addressId);
            if (selected) applySavedAddress(selected);
        }
    };

    const handleFormChange = (setter) => (e) => {
        const { name, value } = e.target;
        setter(prev => {
            const newState = { ...prev, [name]: value };
            if (name === 'province') {
                newState.city = ''; // Reset city when province changes
            }
            return newState;
        });
    };

    const subtotalsByCurrency = useMemo(() => cartWithDetails.reduce((sums, item) => {
        const currency = itemCurrency(item);
        const lineTotal = (item.buyNowPrice || item.price) * item.qty;
        sums[currency] = (sums[currency] || 0) + lineTotal;
        return sums;
    }, {}), [cartWithDetails]);

    const shippingByCurrency = useMemo(() => {
        if (deliveryMethod !== 'ship') return {};
        return cartWithDetails.reduce((sums, item) => {
            const currency = itemCurrency(item);
            const cost = item.shippingCost || 0;
            sums[currency] = Math.max(sums[currency] || 0, cost);
            return sums;
        }, {});
    }, [cartWithDetails, deliveryMethod]);

    const totalsByCurrency = useMemo(() => {
        const currencies = new Set([...Object.keys(subtotalsByCurrency), ...Object.keys(shippingByCurrency)]);
        const totals = {};
        currencies.forEach((currency) => {
            totals[currency] = (subtotalsByCurrency[currency] || 0) + (shippingByCurrency[currency] || 0);
        });
        return totals;
    }, [subtotalsByCurrency, shippingByCurrency]);

    const currencyKeys = Object.keys(totalsByCurrency);
    const isSingleCurrency = currencyKeys.length === 1;
    const cardCurrency = isSingleCurrency ? currencyKeys[0] : null;
    const cardTotal = cardCurrency ? totalsByCurrency[cardCurrency] : 0;

    // Only methods every seller in the cart accepts can be offered.
    // SINPE Móvil needs an admin to have set Subasti's receiving number; hide it until then.
    const [sinpeAvailable, setSinpeAvailable] = useState(null);
    useEffect(() => {
        fetchSinpeAvailability().then(setSinpeAvailable);
    }, []);
    const payOptions = useMemo(
        () => commonPaymentMethods(cartWithDetails).filter(m => m !== 'sinpe' || sinpeAvailable !== false),
        [cartWithDetails, sinpeAvailable]
    );
    useEffect(() => {
        if (payOptions.length > 0 && !payOptions.includes(paymentMethod)) {
            setPaymentMethod(payOptions[0]);
        }
    }, [payOptions, paymentMethod]);

    // Start with the buyer's default saved payment method (a saved card, or the
    // SINPE Móvil number to pay from), once, after their wallet loads.
    useEffect(() => {
        if (paymentPrefilled.current || wallet.loading || payOptions.length === 0) return;
        paymentPrefilled.current = true;
        const { cards, sinpe, defaultPayment } = wallet.payments;
        if (sinpe.length > 0) {
            const preferred = sinpe.find(n => defaultPayment === `sinpe:${n.id}`) || sinpe[0];
            setSinpePhone(preferred.phone);
        }
        if (defaultPayment && defaultPayment.startsWith('sinpe:') && payOptions.includes('sinpe')) {
            setPaymentMethod('sinpe');
        } else if (cards.length > 0 && payOptions.includes('card')) {
            const preferred = cards.find(c => defaultPayment === `card:${c.id}`) || cards[0];
            setSelectedCardId(preferred.id);
        }
    }, [wallet.loading, wallet.payments, payOptions]);

    const stripeOptions = useMemo(() => ({
        mode: 'payment',
        // This only hints to Stripe.js which payment-method UIs to offer (e.g.
        // wallet eligibility) — the real charge amount is always whatever the
        // server computes fresh in create-intent.js at submit time, from
        // authoritative item data, not from this client-side value.
        amount: cardTotal > 0 ? Math.round(cardTotal * 100) : 100,
        currency: (cardCurrency || 'usd').toLowerCase(),
    }), [cardTotal, cardCurrency]);

    // Resume after a 3D Secure redirect: Stripe sends the shopper back to this
    // same page with these query params instead of resolving confirmPayment() inline.
    useEffect(() => {
        const paymentIntentId = searchParams.get('payment_intent');
        const redirectStatus = searchParams.get('redirect_status');
        if (redirectStatus !== 'succeeded' || !paymentIntentId) return;
        let cancelled = false;
        waitForOrders(paymentIntentId).then((ready) => {
            if (cancelled) return;
            setResumingRedirect(false);
            if (ready) {
                clearCart();
                alert(L.orderSuccess);
            }
            navigate('/profile?tab=buying', { replace: true });
        });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const saveShippingAddressIfNeeded = async () => {
        if (deliveryMethod !== 'ship' || selectedAddressId !== 'new' || !saveNewAddress) return;
        if (!(shippingData.address && shippingData.province && shippingData.city && shippingData.postalCode)) return;
        try {
            const result = await walletApi.createAddress({
                alias: '',
                fullName: shippingData.fullName,
                address: shippingData.address,
                city: shippingData.city,
                province: shippingData.province,
                postalCode: shippingData.postalCode,
                makeDefault: wallet.addresses.length === 0,
            });
            wallet.setAddresses(result.addresses);
        } catch {
            // Saving the address is a convenience; never block the purchase on it.
        }
    };

    const sinpeDigits = sinpePhone.replace(/\D/g, '');

    const handleSinpeSubmit = async () => {
        const orders = await createCheckoutOrders({
            items: cartWithDetails.map(item => ({ ...item, qty: item.qty })),
            fulfillment: deliveryMethod,
            paymentMethod: 'sinpe',
            shippingAddress: deliveryMethod === 'ship' ? shippingData : null,
            sinpePhone: sinpeDigits,
        });
        if (saveSinpe && !wallet.payments.sinpe.some(n => n.phone === sinpeDigits)) {
            walletApi.addSinpeNumber({ phone: sinpeDigits }).then(wallet.setPayments).catch(() => {});
        }
        // The orders exist (stock is reserved) but are NOT paid yet: show how to pay.
        clearCart();
        setSinpeCheckout({ reference: orders[0].paymentReference, phone: sinpeDigits });
    };

    if (sinpeCheckout) {
        return (
            <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-md border">
                <SinpePaymentPanel
                    loc={loc}
                    target={{ reference: sinpeCheckout.reference }}
                    defaultPhone={sinpeCheckout.phone}
                    savedNumbers={wallet.payments.sinpe}
                    onClose={() => navigate('/profile?tab=buying')}
                    closeLabel={L.payLater}
                />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-md border text-center">
                <h2 className="text-2xl font-bold text-gray-800">{loc === 'en' ? 'Please log in to checkout' : 'Por favor inicia sesión para finalizar la compra'}</h2>
                <button onClick={() => navigate('/login')} className="mt-6 bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                    {loc === 'en' ? 'Log In' : 'Iniciar Sesión'}
                </button>
            </div>
        );
    }

    if (resumingRedirect) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-md border text-center">
                <h2 className="text-2xl font-bold text-gray-800">{L.confirming}</h2>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-md border text-center">
                <h2 className="text-2xl font-bold text-gray-800">{loc === 'en' ? 'Your cart is empty' : 'Tu carrito está vacío'}</h2>
                <button onClick={() => navigate('/')} className="mt-6 bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                    {loc === 'en' ? 'Continue Shopping' : 'Seguir Comprando'}
                </button>
            </div>
        );
    }

    const provinces = Object.keys(COSTA_RICA_LOCATIONS);
    const cities = shippingData.province ? COSTA_RICA_LOCATIONS[shippingData.province] : [];

    const sharedProps = {
        loc, L, user, cartWithDetails, deliveryMethod, setDeliveryMethod, isShippingAvailable, isPickupAvailable,
        selectedAddressId, handleAddressSelection, shippingData, handleFormChange, setShippingData, saveNewAddress,
        setSaveNewAddress, provinces, cities, paymentMethod, setPaymentMethod,
        subtotalsByCurrency, shippingByCurrency, totalsByCurrency, placing, setPlacing,
        cardCurrency, cardTotal, saveShippingAddressIfNeeded, handleSinpeSubmit, navigate, clearCart, payOptions,
        wallet, selectedCardId, setSelectedCardId, saveCard, setSaveCard, sinpePhone, setSinpePhone, sinpeDigits, saveSinpe, setSaveSinpe,
    };

    return (
        <Elements stripe={getStripePromise()} options={stripeOptions}>
            <CheckoutFormBody {...sharedProps} />
        </Elements>
    );
};

const CheckoutFormBody = (props) => {
    const {
        loc, L, cartWithDetails, deliveryMethod, setDeliveryMethod, isShippingAvailable, isPickupAvailable,
        selectedAddressId, handleAddressSelection, shippingData, handleFormChange, setShippingData, saveNewAddress,
        setSaveNewAddress, provinces, cities, paymentMethod, setPaymentMethod,
        subtotalsByCurrency, shippingByCurrency, totalsByCurrency, placing, setPlacing,
        cardCurrency, saveShippingAddressIfNeeded, handleSinpeSubmit, navigate, user, clearCart, payOptions,
        wallet, selectedCardId, setSelectedCardId, saveCard, setSaveCard, sinpePhone, setSinpePhone, sinpeDigits, saveSinpe, setSaveSinpe,
    } = props;

    const stripe = useStripe();
    const elements = useElements();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            navigate('/login');
            return;
        }
        if (payOptions.length === 0) {
            alert(L.noCommonPayment);
            return;
        }
        saveShippingAddressIfNeeded();
        setPlacing(true);
        try {
            if (paymentMethod === 'sinpe') {
                if (sinpeDigits.length !== 8) {
                    alert(L.sinpePhoneRequired);
                    return;
                }
                await handleSinpeSubmit();
                return;
            }

            if (!cardCurrency) {
                alert(L.mixedCurrency);
                return;
            }
            const useSaved = Boolean(selectedCardId);
            if (!stripe || (!useSaved && !elements)) {
                alert(L.cardUnavailable);
                return;
            }

            if (!useSaved) {
                const submitResult = await elements.submit();
                if (submitResult.error) {
                    alert(submitResult.error.message || L.cardUnavailable);
                    return;
                }
            }

            const intentRes = await fetch('/api/payments/create-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cartWithDetails.map(item => ({ id: item.id, qty: item.qty })),
                    fulfillment: deliveryMethod,
                    shippingAddress: deliveryMethod === 'ship' ? shippingData : null,
                    ...(useSaved ? { paymentMethodId: selectedCardId } : { saveCard }),
                }),
            });
            if (!intentRes.ok) {
                const body = await intentRes.json().catch(() => ({}));
                throw new Error(body.error || 'CREATE_INTENT_FAILED');
            }
            const { clientSecret, paymentIntentId } = await intentRes.json();

            const { error, paymentIntent } = useSaved
                ? await stripe.confirmCardPayment(clientSecret, { payment_method: selectedCardId })
                : await stripe.confirmPayment({
                    elements,
                    clientSecret,
                    confirmParams: { return_url: window.location.href.split('?')[0] },
                    redirect: 'if_required',
                });

            if (error) {
                alert(error.message || (loc === 'en' ? 'Payment failed. Please try again.' : 'El pago falló. Intente de nuevo.'));
                return;
            }

            if (paymentIntent && paymentIntent.status === 'succeeded') {
                // Webhook is the source of truth for order creation and can land a
                // beat after this resolves; wait briefly, then proceed regardless —
                // the order will show up in Buying shortly even if it's not ready yet.
                await waitForOrders(paymentIntent.id || paymentIntentId);
                clearCart();
                alert(L.orderSuccess);
                navigate('/profile?tab=buying');
            }
        } catch {
            alert(loc === 'en' ? 'Checkout failed. Please try again.' : 'Error en la compra. Intente de nuevo.');
        } finally {
            setPlacing(false);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">{L.title}</h1>
            <EscrowPanel loc={loc} />
            <p className="text-sm text-gray-600 mb-6 -mt-2">{L.escrowNote}</p>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Delivery Method */}
                    <div className="bg-white p-6 rounded-lg shadow-md border">
                        <h2 className="text-xl font-bold mb-4">{L.deliveryMethod}</h2>
                        <div className="flex gap-4">
                            {isShippingAvailable && (
                                <button type="button" onClick={() => setDeliveryMethod('ship')} className={`p-4 rounded-lg border-2 flex-1 text-left ${deliveryMethod === 'ship' ? 'bg-purple-50 border-purple-600' : 'bg-gray-50'}`}>
                                    <p className="font-bold">{L.shipToAddress}</p>
                                    <p className="text-sm text-gray-500">{L.standardShipping}</p>
                                </button>
                            )}
                            {isPickupAvailable && (
                                <button type="button" onClick={() => setDeliveryMethod('pickup')} className={`p-4 rounded-lg border-2 flex-1 text-left ${deliveryMethod === 'pickup' ? 'bg-purple-50 border-purple-600' : 'bg-gray-50'}`}>
                                    <p className="font-bold">{L.localPickup}</p>
                                    <p className="text-sm text-gray-500">{L.collectFromSeller}</p>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Shipping Info */}
                    {deliveryMethod === 'ship' && (
                        <div className="bg-white p-6 rounded-lg shadow-md border">
                            <h2 className="text-xl font-bold mb-4">{L.shippingInfo}</h2>
                            <div className="space-y-2 mb-4">
                                {wallet.addresses.map(addr => (
                                    <label key={addr.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="addressSelection"
                                            value={addr.id}
                                            checked={selectedAddressId === addr.id}
                                            onChange={() => handleAddressSelection(addr.id)}
                                            className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                                        />
                                        <div className="ml-3">
                                            <p className="font-bold">{addr.alias}{addr.isDefault && <span className="ml-2 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">{L.defaultTag}</span>}</p>
                                            <p className="text-sm text-gray-600">{addr.address}, {addr.city}</p>
                                        </div>
                                    </label>
                                ))}
                                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="radio"
                                        name="addressSelection"
                                        value="new"
                                        checked={selectedAddressId === 'new'}
                                        onChange={() => handleAddressSelection('new')}
                                        className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                                    />
                                    <p className="ml-3 font-bold">{L.newAddress}</p>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                                <input name="fullName" value={shippingData.fullName} onChange={handleFormChange(setShippingData)} placeholder={L.fullName} className="w-full p-3 border rounded-lg col-span-2 disabled:bg-gray-100" required disabled={selectedAddressId !== 'new'} />
                                <input name="address" value={shippingData.address} onChange={handleFormChange(setShippingData)} placeholder={L.address} className="w-full p-3 border rounded-lg col-span-2 disabled:bg-gray-100" required disabled={selectedAddressId !== 'new'}/>

                                <select name="province" value={shippingData.province} onChange={handleFormChange(setShippingData)} required disabled={selectedAddressId !== 'new'} className="w-full p-3 border rounded-lg disabled:bg-gray-100">
                                    <option value="">{L.province}</option>
                                    {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>

                                <select name="city" value={shippingData.city} onChange={handleFormChange(setShippingData)} required disabled={selectedAddressId !== 'new' || !shippingData.province} className="w-full p-3 border rounded-lg disabled:bg-gray-100">
                                    <option value="">{L.city}</option>
                                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>

                                <input name="postalCode" value={shippingData.postalCode} onChange={handleFormChange(setShippingData)} placeholder={L.postalCode} className="w-full p-3 border rounded-lg disabled:bg-gray-100" required disabled={selectedAddressId !== 'new'}/>
                                <input name="country" value={shippingData.country} onChange={handleFormChange(setShippingData)} placeholder={L.country} className="w-full p-3 border rounded-lg col-span-2 disabled:bg-gray-100" required disabled={selectedAddressId !== 'new'}/>
                                {selectedAddressId === 'new' && (
                                    <div className="col-span-2">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={saveNewAddress}
                                                onChange={(e) => setSaveNewAddress(e.target.checked)}
                                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                            />
                                            <span className="ml-2 text-sm text-gray-600">{L.saveAddress}</span>
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {deliveryMethod === 'pickup' && (
                        <div className="bg-white p-6 rounded-lg shadow-md border">
                            <p className="text-center text-gray-600">{L.pickupInstructions}</p>
                        </div>
                    )}


                    {/* Payment Info */}
                    <div className="bg-white p-6 rounded-lg shadow-md border">
                        <h2 className="text-xl font-bold mb-4">{L.paymentInfo}</h2>
                        {payOptions.length === 0 ? (
                            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm space-y-2">
                                <p className="font-semibold">{L.noCommonPayment}</p>
                                <ul className="list-disc pl-5">
                                    {cartWithDetails.map(item => (
                                        <li key={item.id}>{item.title}: {L.acceptsLabel} {acceptedMethods(item).map(m => paymentMethodLabel(m, loc)).join(', ')}</li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="flex border-b mb-4">
                                {payOptions.map((method) => (
                                    <button
                                        key={method}
                                        type="button"
                                        onClick={() => setPaymentMethod(method)}
                                        className={`py-2 px-4 font-semibold ${paymentMethod === method ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}
                                    >
                                        {method === 'card' ? L.card : L.sinpe}
                                    </button>
                                ))}
                            </div>
                        )}
                        {payOptions.length > 0 && paymentMethod === 'card' && (
                            cardCurrency ? (
                                <div className="space-y-3">
                                    {wallet.payments.cards.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold text-gray-700">{L.savedCards}</p>
                                            {wallet.payments.cards.map(c => (
                                                <label key={c.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                                    <input type="radio" name="savedCard" checked={selectedCardId === c.id} onChange={() => setSelectedCardId(c.id)} className="h-4 w-4 text-purple-600 focus:ring-purple-500" />
                                                    <span className="ml-3 font-semibold">{cardBrandName(c.brand)} •••• {c.last4}</span>
                                                    {c.expMonth && <span className="ml-2 text-sm text-gray-500">{L.expires} {String(c.expMonth).padStart(2, '0')}/{String(c.expYear).slice(-2)}</span>}
                                                </label>
                                            ))}
                                            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                                <input type="radio" name="savedCard" checked={selectedCardId === null} onChange={() => setSelectedCardId(null)} className="h-4 w-4 text-purple-600 focus:ring-purple-500" />
                                                <span className="ml-3 font-semibold">{L.useNewCard}</span>
                                            </label>
                                        </div>
                                    )}
                                    {!selectedCardId && (
                                        <>
                                            <PaymentElement />
                                            <label className="flex items-center">
                                                <input type="checkbox" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" />
                                                <span className="ml-2 text-sm text-gray-600">{L.saveCardForLater}</span>
                                            </label>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{L.mixedCurrency}</p>
                            )
                        )}
                        {payOptions.length > 0 && paymentMethod === 'sinpe' && (
                            <>
                            <div className="bg-gray-50 p-4 rounded-lg text-center">
                                <p className="text-sm text-gray-600">{L.sinpeCheckoutNote}</p>
                            </div>
                            <div className="mt-4 text-left">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">{L.sinpeFrom}</label>
                                {wallet.payments.sinpe.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {wallet.payments.sinpe.map(n => (
                                            <button
                                                key={n.id}
                                                type="button"
                                                onClick={() => setSinpePhone(n.phone)}
                                                className={`px-3 py-1 rounded-full border text-sm font-mono ${sinpeDigits === n.phone ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-300 text-gray-700'}`}
                                            >{formatSinpePhone(n.phone)}{n.alias ? ` · ${n.alias}` : ''}</button>
                                        ))}
                                    </div>
                                )}
                                <input
                                    type="tel"
                                    value={sinpePhone}
                                    onChange={(e) => setSinpePhone(e.target.value)}
                                    placeholder="8888-8888"
                                    maxLength={12}
                                    className="w-full p-3 border rounded-lg font-mono"
                                    autoComplete="tel-national"
                                />
                                <p className="text-xs text-gray-500 mt-1">{L.sinpeFromHelp}</p>
                                {!wallet.payments.sinpe.some(n => n.phone === sinpeDigits) && (
                                    <label className="flex items-center mt-2">
                                        <input type="checkbox" checked={saveSinpe} onChange={(e) => setSaveSinpe(e.target.checked)} className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" />
                                        <span className="ml-2 text-sm text-gray-600">{L.saveSinpeNumber}</span>
                                    </label>
                                )}
                            </div>
                            </>
                        )}
                    </div>
                </div>
                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-md border">
                        <h2 className="text-xl font-bold border-b pb-4 mb-4">{L.orderSummary}</h2>
                        <div className="space-y-3 mb-4">
                            {cartWithDetails.map(item => (
                                <div key={item.id} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center">
                                        <img src={item.image} className="w-12 h-12 flex-shrink-0 object-cover rounded-md mr-3" alt={item.title}/>
                                        <span>{item.title} <span className="text-gray-500">x{item.qty}</span></span>
                                    </div>
                                    <span className="font-semibold">{CRC((item.buyNowPrice || item.price) * item.qty, loc, itemCurrency(item))}</span>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2 border-t pt-4">
                            <div className="flex justify-between"><span>{L.subtotal}</span><span>{formatMoneyTotals(subtotalsByCurrency, loc)}</span></div>
                            <div className="flex justify-between"><span>{L.shipping}</span><span>{Object.keys(shippingByCurrency).length === 0 ? L.free : formatMoneyTotals(shippingByCurrency, loc)}</span></div>
                            <div className="flex justify-between font-bold text-lg border-t pt-4 mt-2"><span>{L.total}</span><span>{formatMoneyTotals(totalsByCurrency, loc)}</span></div>
                        </div>
                        <button type="submit" disabled={placing || payOptions.length === 0} className="mt-6 w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60">
                            {placing ? L.placing : L.placeOrder}
                        </button>
                        <p className="text-xs text-gray-500 mt-3 text-center">{L.escrowNote}</p>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CheckoutPage;
