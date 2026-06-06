import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useItems } from '../context/ItemsContext';
import { PLACEHOLDER_IMG, CRC } from '../components/Shared';
import { tCategory } from '../data/i18n';

const CartPage = ({ loc }) => {
    const { cart, updateQuantity, removeFromCart } = useCart();
    const { items } = useItems();
    const navigate = useNavigate();
    const L = loc === 'en' ? {
        title: 'My Cart',
        item: 'Item',
        price: 'Price',
        quantity: 'Quantity',
        total: 'Total',
        subtotal: 'Subtotal',
        shipping: 'Shipping',
        orderTotal: 'Order Total',
        checkout: 'Proceed to Checkout',
        emptyCart: 'Your cart is empty.',
        continueShopping: 'Continue Shopping',
        shippingNote: 'Calculated at next step',
        remove: 'Remove',
        each: 'each',
    } : {
        title: 'Mi Carrito',
        item: 'Artículo',
        price: 'Precio',
        quantity: 'Cantidad',
        total: 'Total',
        subtotal: 'Subtotal',
        shipping: 'Envío',
        orderTotal: 'Total de la Orden',
        checkout: 'Proceder al Pago',
        emptyCart: 'Tu carrito está vacío.',
        continueShopping: 'Seguir Comprando',
        shippingNote: 'Calculado en el siguiente paso',
        remove: 'Eliminar',
        each: 'c/u',
    };

    const cartWithDetails = useMemo(() => {
        return cart.map(cartItem => {
            const itemDetails = items.find(item => item.id === cartItem.id);
            return { ...cartItem, ...itemDetails };
        });
    }, [cart, items]);

    const subtotal = useMemo(() => {
        return cartWithDetails.reduce((sum, item) => sum + (item.price * item.qty), 0);
    }, [cartWithDetails]);

    if (cart.length === 0) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-md border text-center">
                <h2 className="text-2xl font-bold text-gray-800">{L.emptyCart}</h2>
                <button onClick={() => navigate('/')} className="mt-6 bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                    {L.continueShopping}
                </button>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">{L.title}</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border space-y-4">
                    {cartWithDetails.map(item => (
                        <div key={item.id} className="flex items-center gap-4 border-b pb-4 last:border-b-0">
                            <img src={item.image || PLACEHOLDER_IMG} alt={item.title} className="w-24 h-24 object-cover rounded-lg" />
                            <div className="flex-grow">
                                <h3 className="font-semibold text-lg">{item.title}</h3>
                                <p className="text-sm text-gray-500">{tCategory(item.category, loc)}</p>
                                <button onClick={() => removeFromCart(item.id)} className="text-red-500 text-sm font-semibold hover:underline mt-1">{L.remove}</button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => updateQuantity(item.id, item.qty - 1)} className="w-8 h-8 border rounded-md">-</button>
                                <input type="number" value={item.qty} onChange={(e) => updateQuantity(item.id, parseInt(e.target.value, 10))} className="w-12 text-center border rounded-md" />
                                <button onClick={() => updateQuantity(item.id, item.qty + 1)} className="w-8 h-8 border rounded-md">+</button>
                            </div>
                            <div className="text-right w-24">
                                <p className="font-bold">{CRC(item.price * item.qty, loc)}</p>
                                {item.qty > 1 && <p className="text-sm text-gray-500">{CRC(item.price, loc)} {L.each}</p>}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-md border">
                        <h2 className="text-xl font-bold border-b pb-4 mb-4">{L.orderTotal}</h2>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>{L.subtotal}</span>
                                <span>{CRC(subtotal, loc)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>{L.shipping}</span>
                                <span>{L.shippingNote}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t pt-4 mt-2">
                                <span>{L.orderTotal}</span>
                                <span>{CRC(subtotal, loc)}</span>
                            </div>
                        </div>
                        <button onClick={() => navigate('/checkout')} className="mt-6 w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                            {L.checkout}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CartPage;