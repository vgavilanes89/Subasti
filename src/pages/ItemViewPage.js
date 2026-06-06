import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useItems } from '../context/ItemsContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { PLACEHOLDER_IMG, CRC, CountdownTimer, StarRating, calculateAverageRating, useCountdown } from '../components/Shared';
import { tCategory, tSubCategory, formatCondition } from '../data/i18n';

const ItemViewPage = ({ loc }) => {
    // 1. Get ID from URL and tools from Context
    const { id } = useParams();
    const navigate = useNavigate();
    const { items, isFav, toggleFav } = useItems();
    const { addToCart } = useCart();
    // We access 'users' map here to look up seller details by ID
    const { user, users } = useAuth(); 

    // 2. Find specific data
    const item = items.find(i => i.id === id);
    const seller = item ? users[item.sellerId] : null;

    // 3. Local State
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedQuantity, setSelectedQuantity] = useState(1);
    
    // 4. Always call hooks unconditionally (Rules of Hooks)
    // Fallback values prevent errors if item is undefined
    const targetDate = item ? item.endAt : Date.now();
    const { isFinished } = useCountdown(targetDate);
    const averageRating = useMemo(
        () => calculateAverageRating(seller ? seller.reviews : []),
        [seller]
    );
    
    // 5. Handle "Not Found" case AFTER hooks
    if (!item) {
        return (
            <div>
                <button className="text-purple-600 font-semibold mb-4" onClick={() => navigate('/')}>
                    ← {loc === 'en' ? 'Back to search' : 'Volver a la búsqueda'}
                </button>
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    {loc === 'en' ? 'Item not found' : 'Artículo no encontrado'}
                </div>
            </div>
        );
    }

    // 6. Localization & Logic
    const L = loc === 'en' ? { 
        back: 'Back', 
        add: 'Add to cart', 
        placeBid: 'Place Bid', 
        fav: 'Favorite', 
        details: 'Details', 
        sale: 'Sale type', 
        buy: 'Buy Now', 
        auc: 'Auction', 
        condition: 'Condition', 
        ends: 'Ends in', 
        bids: 'Bids', 
        quantity: 'Quantity', 
        shipping: 'Shipping Options', 
        ship: 'Available for shipping', 
        localPickup: 'Local pickup', 
        buyNow: 'Buy Now', 
        auctionEnded: 'Auction Ended', 
        sold: 'Sold! Winning Bid:', 
        reserveNotMet: 'Reserve price not met.', 
        finalBid: 'Final Bid:', 
        available: 'available', 
        soldBy: 'Sold by', 
        favAdd: 'Add to favorites', 
        favRemove: 'Remove from favorites', 
        new: 'New', 
        used: 'Used',
        noDescription: 'No detailed description available.',
        noShipping: 'No shipping options specified.',
        buyNowFor: 'Buy Now for',
        currentBid: 'Current Bid',
        price: 'Price',
    } : { 
        back: 'Atrás', 
        add: 'Agregar al carrito', 
        placeBid: 'Hacer Puja', 
        fav: 'Favorito', 
        details: 'Detalles', 
        sale: 'Tipo de venta', 
        buy: 'Compra inmediata', 
        auc: 'Subasta', 
        condition: 'Condición', 
        ends: 'Termina en', 
        bids: 'Ofertas', 
        quantity: 'Cantidad', 
        shipping: 'Opciones de Envío', 
        ship: 'Disponible para envío', 
        localPickup: 'Recogida local', 
        buyNow: 'Comprar Ahora', 
        auctionEnded: 'Subasta Terminada', 
        sold: '¡Vendido! Oferta Ganadora:', 
        reserveNotMet: 'Precio de reserva no alcanzado.', 
        finalBid: 'Oferta Final:', 
        available: 'disponibles', 
        soldBy: 'Vendido por', 
        favAdd: 'Agregar a favoritos', 
        favRemove: 'Quitar de favoritos', 
        new: 'Nuevo', 
        used: 'Usado',
        noDescription: 'No hay descripción detallada.',
        noShipping: 'No se especificaron opciones de envío.',
        buyNowFor: 'Comprar Ahora por',
        currentBid: 'Oferta Actual',
        price: 'Precio',
    };

    const reserveMet = item.reservePrice ? item.currentBid >= item.reservePrice : true;
    const images = item.images && item.images.length > 0 ? item.images : [PLACEHOLDER_IMG];

    const handleBuyNow = () => {
        if(!user) { navigate('/login'); return; }
        addToCart(item.id, selectedQuantity);
        navigate('/cart');
    };

    const handleSellerClick = (sellerId) => {
        navigate(`/seller/${sellerId}`);
    };
    
    const handleToggleFav = () => {
        if(!user) { navigate('/login'); return; }
        toggleFav(item.id);
    };

    return (
        <div>
            <button className="text-purple-600 font-semibold mb-4 inline-flex items-center" onClick={() => navigate(-1)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                {L.back}
            </button>
            <div className="grid md:grid-cols-5 gap-8 mb-8">
                {/* Image Gallery */}
                <div className="md:col-span-3">
                    <div className="relative group">
                        <img src={images[currentImageIndex]} alt={item.title} className="w-full h-auto object-cover rounded-xl shadow-lg border border-gray-200 mb-4" />
                        {images.length > 1 && (
                            <div className="absolute top-1/2 w-full flex justify-between px-2 -translate-y-1/2">
                                <button onClick={() => setCurrentImageIndex((currentImageIndex - 1 + images.length) % images.length)} className="bg-black bg-opacity-30 text-white rounded-full p-2 hover:bg-opacity-50 transition-all">←</button>
                                <button onClick={() => setCurrentImageIndex((currentImageIndex + 1) % images.length)} className="bg-black bg-opacity-30 text-white rounded-full p-2 hover:bg-opacity-50 transition-all">→</button>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                        {images.map((img, index) => (
                            <img key={index} src={img} alt="thumb" onClick={() => setCurrentImageIndex(index)} className={`w-20 h-20 object-cover rounded-md cursor-pointer border-2 ${currentImageIndex === index ? 'border-purple-600' : 'border-transparent hover:border-gray-300'}`} />
                        ))}
                    </div>
                </div>

                {/* Product Info & Actions */}
                <div className="md:col-span-2">
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{item.title}</h1>
                                <p className="text-md text-gray-500 mt-1">{tCategory(item.category, loc)} {item.subCategory && <span>&gt; {tSubCategory(item.subCategory, loc)}</span>}</p>
                            </div>
                            <button onClick={handleToggleFav} className={`p-2 rounded-full transition-colors ${isFav(item.id) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`} title={isFav(item.id) ? L.favRemove : L.favAdd}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isFav(item.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                            </button>
                        </div>
                        
                        <div className="mt-6">
                            {item.saleType === 'auc' ? (
                                <div>
                                    {isFinished ? (
                                        <div className="bg-gray-100 p-4 rounded-lg text-center">
                                            <h3 className="text-lg font-bold text-gray-800">{L.auctionEnded}</h3>
                                            <p className="mt-2">{reserveMet ? `${L.sold} ${CRC(item.currentBid, loc)}` : L.reserveNotMet}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-sm text-gray-500">{L.currentBid}</p>
                                            <p className="text-4xl font-extrabold text-gray-900">{CRC(item.currentBid, loc)}</p>
                                            <div className="mt-4 space-y-2">
                                                <button className="w-full bg-indigo-500 text-white py-3 rounded-lg font-bold hover:bg-indigo-600 transition-colors">{L.placeBid}</button>
                                                {item.buyNowPrice && (
                                                    <button className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors" onClick={handleBuyNow}>{L.buyNowFor} {CRC(item.buyNowPrice, loc)}</button>
                                                )}
                                            </div>
                                            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                                                <p className="font-semibold text-gray-700">{L.ends}</p>
                                                <CountdownTimer targetDate={item.endAt} loc={loc} />
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm text-gray-500">{L.price}</p>
                                    <p className="text-4xl font-extrabold text-gray-900">{CRC(item.price * selectedQuantity, loc)}</p>
                                    {item.quantity > 1 && (
                                        <div className="mt-4 flex items-center gap-2">
                                            <button onClick={() => setSelectedQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 border rounded-md font-bold">-</button>
                                            <input type="number" value={selectedQuantity} onChange={(e) => setSelectedQuantity(Math.max(1, Math.min(item.quantity, Number(e.target.value) || 1)))} className="w-16 text-center border rounded-md h-10" />
                                            <button onClick={() => setSelectedQuantity(q => Math.min(item.quantity, q + 1))} className="w-10 h-10 border rounded-md font-bold">+</button>
                                        </div>
                                    )}
                                    <div className="mt-6 flex gap-4">
                                        <button className="flex-1 bg-purple-100 text-purple-700 py-3 rounded-lg font-bold hover:bg-purple-200" onClick={() => addToCart(item.id, selectedQuantity)}>{L.add}</button>
                                        <button className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700" onClick={handleBuyNow}>{L.buyNow}</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Section */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-sm">
                <h3 className="font-bold text-lg mb-2">{L.details}</h3>
                <p><b>{L.sale}:</b> <span className="capitalize">{item.saleType==='auc'?L.auc:L.buy}</span></p>
                <p><b>{L.condition}:</b> <span>{formatCondition(item.condition, loc, item.conditionDetail)}</span></p>
                {item.saleType === 'buy' && item.quantity > 1 && <p><b>{L.quantity}:</b> {item.quantity}</p>}
                {seller && (
                    <p className="flex items-center gap-2">
                        <b>{L.soldBy}:</b>
                        <button onClick={() => handleSellerClick(seller.id)} className="text-purple-600 hover:underline font-semibold">{seller.profileName}</button>
                        {averageRating > 0 && (
                            <span className="inline-flex items-center">
                                <StarRating rating={averageRating} />
                                <span className="text-xs text-gray-500 ml-1">({seller.reviews.length})</span>
                            </span>
                        )}
                    </p>
                )}
                <p className="mt-2 text-gray-600">{item.description || L.noDescription}</p>
                <div className="border-t mt-4 pt-4">
                    <h4 className="font-bold text-md mb-2">{L.shipping}</h4>
                    <ul className="list-disc list-inside text-gray-600">
                        {item.shippingShip && <li>{L.ship} {item.shippingCost > 0 ? `(${CRC(item.shippingCost, loc)})` : ''}</li>}
                        {item.shippingLocal && <li>{L.localPickup}</li>}
                        {!item.shippingShip && !item.shippingLocal && <li>{L.noShipping}</li>}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ItemViewPage;