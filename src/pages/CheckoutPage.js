import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useItems } from '../context/ItemsContext';
import { COSTA_RICA_LOCATIONS } from '../data/Constants';
import { CRC, itemCurrency, formatMoneyTotals } from '../components/Shared';
import EscrowPanel from '../components/EscrowPanel';
import { createCheckoutOrders } from '../api/orders';

const CheckoutPage = ({ loc }) => {
    const { user, saveAddress } = useAuth();
    const { cart, clearCart } = useCart();
    const { items } = useItems();
    const navigate = useNavigate();
    
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
        cardName: 'Name on Card',
        cardNumber: 'Card Number',
        expiry: 'Expiry (MM/YY)',
        cvc: 'CVC',
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
        escrowNote: 'Your payment is held securely by Subasti until you receive the item and confirm satisfaction (or 48 hours pass).',
        orderSuccess: 'Payment secured in Subasti escrow. Track your order in Buying.',
        placing: 'Securing payment…',
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
        cardName: 'Nombre en la Tarjeta',
        cardNumber: 'Número de Tarjeta',
        expiry: 'Vencimiento (MM/AA)',
        cvc: 'CVC',
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
        escrowNote: 'Su pago queda retenido de forma segura por Subasti hasta que reciba el artículo y confirme conformidad (o pasen 48 horas).',
        orderSuccess: 'Pago asegurado en depósito Subasti. Rastree su pedido en Compras.',
        placing: 'Asegurando pago…',
    };

    const isShippingAvailable = useMemo(() => cartWithDetails.every(item => item.shippingShip), [cartWithDetails]);
    const isPickupAvailable = useMemo(() => cartWithDetails.every(item => item.shippingLocal), [cartWithDetails]);
    
    const [deliveryMethod, setDeliveryMethod] = useState(isShippingAvailable ? 'ship' : 'pickup');
    
    const [selectedAddressId, setSelectedAddressId] = useState(user?.defaultAddressId || 'new');
    const [saveNewAddress, setSaveNewAddress] = useState(true);

    const [shippingData, setShippingData] = useState(() => {
        const defaultAddress = user?.savedAddresses?.find(a => a.id === user.defaultAddressId);
        if (defaultAddress) {
            return {
                fullName: user.realName || '',
                address: defaultAddress.address,
                city: defaultAddress.city,
                province: defaultAddress.province,
                postalCode: defaultAddress.postalCode,
                country: 'Costa Rica',
            };
        }
        return { fullName: user?.realName || '', address: '', city: '', province: '', postalCode: '', country: 'Costa Rica' };
    });

    const [paymentMethod, setPaymentMethod] = useState('card');
    const [paymentDetails, setPaymentDetails] = useState({ nameOnCard: '', number: '', expiry: '', cvc: '' });
    
    const [showPaymentPrompt, setShowPaymentPrompt] = useState(true);
    const [placing, setPlacing] = useState(false);
    
    const defaultPayment = useMemo(() => user?.savedPayments?.find(p => p.id === user.defaultPaymentId), [user]);

    const handleAddressSelection = (addressId) => {
        setSelectedAddressId(addressId);
        if (addressId === 'new') {
            setShippingData({ fullName: user?.realName || '', address: '', city: '', province: '', country: 'Costa Rica', postalCode: '' });
        } else {
            const selectedAddress = user.savedAddresses.find(addr => addr.id === addressId);
            if (selectedAddress) {
                setShippingData({
                    fullName: user.realName || '',
                    address: selectedAddress.address,
                    city: selectedAddress.city,
                    province: selectedAddress.province,
                    postalCode: selectedAddress.postalCode,
                    country: 'Costa Rica'
                });
            }
        }
    };
    
    const handleUseDefaultPayment = () => {
        if(defaultPayment) {
            setPaymentMethod(defaultPayment.type);
            if (defaultPayment.type === 'card') {
                setPaymentDetails({ nameOnCard: defaultPayment.nameOnCard || '', number: defaultPayment.number, expiry: defaultPayment.expiry, cvc: ''});
            }
            setShowPaymentPrompt(false);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            navigate('/login');
            return;
        }
        if (deliveryMethod === 'ship' && selectedAddressId === 'new' && saveNewAddress) {
            if (shippingData.address && shippingData.province && shippingData.city && shippingData.postalCode) {
                const newAddressToSave = {
                    alias: `${L.addressAlias} (${shippingData.address.substring(0, 15)}...)`,
                    address: shippingData.address,
                    city: shippingData.city,
                    province: shippingData.province,
                    postalCode: shippingData.postalCode,
                };
                saveAddress(newAddressToSave);
            }
        }
        setPlacing(true);
        try {
            await createCheckoutOrders({
                buyerId: user.id,
                items: cartWithDetails.map(item => ({
                    ...item,
                    qty: item.qty,
                })),
                fulfillment: deliveryMethod,
                paymentMethod,
            });
            clearCart();
            alert(L.orderSuccess);
            navigate('/profile?tab=buying');
        } catch {
            alert(loc === 'en' ? 'Checkout failed. Please try again.' : 'Error en la compra. Intente de nuevo.');
        } finally {
            setPlacing(false);
        }
    };

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
                                {user?.savedAddresses?.map(addr => (
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
                                            <p className="font-bold">{addr.alias}</p>
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
                        {defaultPayment && showPaymentPrompt && (
                            <div className="bg-purple-50 p-3 rounded-lg flex justify-between items-center mb-4">
                                <p className="text-sm text-purple-800"><b>{L.useDefaultPayment}</b> "{defaultPayment.alias}"</p>
                                <button type="button" onClick={handleUseDefaultPayment} className="text-sm font-bold bg-purple-200 text-purple-800 px-3 py-1 rounded-md hover:bg-purple-300">{L.useThis}</button>
                            </div>
                        )}
                        <div className="flex border-b mb-4">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('card')}
                                className={`py-2 px-4 font-semibold ${paymentMethod === 'card' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}
                            >
                                {L.card}
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('sinpe')}
                                className={`py-2 px-4 font-semibold ${paymentMethod === 'sinpe' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}
                            >
                                {L.sinpe}
                            </button>
                        </div>
                        {paymentMethod === 'card' && (
                            <div className="space-y-4">
                                <input name="nameOnCard" value={paymentDetails.nameOnCard} onChange={handleFormChange(setPaymentDetails)} placeholder={L.cardName} className="w-full p-3 border rounded-lg" required={paymentMethod === 'card'} />
                                <input name="number" value={paymentDetails.number} onChange={handleFormChange(setPaymentDetails)} placeholder={L.cardNumber} type="tel" inputMode="numeric" pattern="[0-9\s]{13,19}" className="w-full p-3 border rounded-lg" required={paymentMethod === 'card'} />
                                <div className="grid grid-cols-2 gap-4">
                                    <input name="expiry" value={paymentDetails.expiry} onChange={handleFormChange(setPaymentDetails)} placeholder={L.expiry} className="w-full p-3 border rounded-lg" required={paymentMethod === 'card'} />
                                    <input name="cvc" value={paymentDetails.cvc} onChange={handleFormChange(setPaymentDetails)} placeholder={L.cvc} className="w-full p-3 border rounded-lg" required={paymentMethod === 'card'} />
                                </div>
                            </div>
                        )}
                        {paymentMethod === 'sinpe' && (
                            <div className="bg-gray-50 p-4 rounded-lg text-center">
                                <p className="text-sm text-gray-600">{L.sinpeInstructions}</p>
                                <p className="text-2xl font-bold text-gray-800 my-2">{defaultPayment?.type === 'sinpe' ? defaultPayment.phone : '8888-8888'}</p>
                            </div>
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
                                        <img src={item.image} className="w-12 h-12 rounded-md mr-3" alt={item.title}/>
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
                        <button type="submit" disabled={placing} className="mt-6 w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60">
                            {placing ? L.placing : L.placeOrder}
                        </button>
                        <p className="text-xs text-gray-500 mt-3 text-center">{L.escrowNote}</p>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default CheckoutPage;