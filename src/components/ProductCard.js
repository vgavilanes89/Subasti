import React from 'react';
import { PLACEHOLDER_IMG, CRC } from './Shared';

const ProductCard = ({ it, onOpen, loc, onToggleFav, isFav }) => {
    const L = loc === 'en' ? { favAdd: 'Add to favorites', favRemove: 'Remove from favorites' } : { favAdd: 'Agregar a favoritos', favRemove: 'Quitar de favoritos' };
    
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col group">
            <div className="relative">
                <img src={it.image || PLACEHOLDER_IMG} alt={it.title} className="w-full h-48 object-cover rounded-t-lg cursor-pointer" onClick={() => onOpen?.(it.id)} />
                {onToggleFav && isFav && (
                    <button onClick={(e) => { e.stopPropagation(); onToggleFav(it.id); }} className="absolute top-2 right-2 bg-white/70 backdrop-blur-sm p-1.5 rounded-full text-gray-600 hover:text-red-500 hover:bg-white transition-all" title={isFav(it.id) ? L.favRemove : L.favAdd}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={isFav(it.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isFav(it.id) ? 'text-red-500' : ''}>
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                )}
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-sm text-gray-500 mb-1">{it.category} {it.subCategory && <span className="text-gray-400">&gt; {it.subCategory}</span>}</h3>
                <div className="flex-grow">
                    <h2 className="text-md font-bold text-gray-800 hover:text-purple-700 cursor-pointer" onClick={() => onOpen?.(it.id)}>{it.title}</h2>
                    <p className="text-xs text-gray-500 capitalize mt-1">{loc === 'en' ? it.condition : (it.condition === 'new' ? 'Nuevo' : 'Usado')}</p>
                </div>
                <div className="mt-4">
                    {it.saleType === 'auc' ? (
                        <div>
                            <p className="text-xs text-gray-500">{loc === 'en' ? 'Current Bid' : 'Oferta Actual'}</p>
                            <p className="text-xl font-black text-gray-900">{CRC(it.currentBid, loc)}</p>
                            {it.shippingShip && it.shippingCost > 0 && <p className="text-xs text-gray-500">+ {CRC(it.shippingCost, loc)} {loc === 'en' ? 'shipping' : 'envío'}</p>}
                        </div>
                    ) : (
                        <div>
                            <p className="text-xs text-gray-500">{loc === 'en' ? 'Price' : 'Precio'}</p>
                            <p className="text-xl font-black text-gray-900">{CRC(it.price, loc)}</p>
                            {it.shippingShip && it.shippingCost > 0 && <p className="text-xs text-gray-500">+ {CRC(it.shippingCost, loc)} {loc === 'en' ? 'shipping' : 'envío'}</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;