import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useItems } from '../context/ItemsContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useHomeFilters } from '../context/HomeFilterContext';
import { PLACEHOLDER_IMG, CRC, CountdownTimer, itemCurrency } from '../components/Shared';
import { tCategory, tSubCategory, formatCondition } from '../data/i18n';

const HomePage = ({ loc, categories }) => {
  // Use global state from Contexts
  const { items, isFav, toggleFav } = useItems();
  const { addToCart } = useCart();
  const { user } = useAuth();
  
  // Use React Router for navigation
  const navigate = useNavigate();
  const { q, setQ, cat, setCat, sort, setSort } = useHomeFilters();

  // Localization strings
  const L = loc === 'en' ? { 
    newest: 'Newest', 
    pAsc: 'Price: Low→High', 
    pDesc: 'Price: High→Low', 
    add: 'Add to cart', 
    all: 'All', 
    none: 'No items match your filters.', 
    fav: 'Favorite', 
    placeBid: 'Place Bid', 
    buyNow: 'Buy Now', 
    favAdd: 'Add to favorites', 
    favRemove: 'Remove from favorites',
    adjustFilters: 'Try adjusting your search filters.',
    shipping: 'shipping',
    auction: 'AUCTION',
    buyNowBadge: 'BUY NOW',
    allCategories: 'All',
  } : { 
    newest: 'Más recientes', 
    pAsc: 'Precio: menor→mayor', 
    pDesc: 'Precio: mayor→menor', 
    add: 'Agregar al carrito', 
    all: 'Todos', 
    none: 'No hay artículos que coincidan con tus filtros.', 
    fav: 'Favorito', 
    placeBid: 'Hacer Puja', 
    buyNow: 'Comprar Ahora', 
    favAdd: 'Agregar a favoritos', 
    favRemove: 'Quitar de favoritos',
    adjustFilters: 'Intenta ajustar tus filtros de búsqueda.',
    shipping: 'envío',
    auction: 'SUBASTA',
    buyNowBadge: 'COMPRA',
    allCategories: 'Todos',
  };

  const allCats = useMemo(() => ['*', ...Object.keys(categories)], [categories]);

  // Filter out ended auctions
  const activeItems = useMemo(() => {
    const now = new Date().getTime();
    return items.filter(item => {
      if (item.saleType === 'auc' && item.endAt < now) return false;
      return true;
    });
  }, [items]);

  const categoryKeys = useMemo(() => Object.keys(categories), [categories]);

  const categoryLinkClass = (value) =>
    `transition-colors ${cat === value ? 'text-purple-600 font-semibold' : 'text-gray-600 hover:text-purple-600'}`;

  // Apply search and category filters
  const filtered = activeItems.filter(i => {
    const qq = (q ?? '').trim().toLowerCase();
    const mq = !qq || (`${i.title} ${i.category} ${i.subCategory || ''}`).toLowerCase().includes(qq);
    const mc = cat === '*' || i.category === cat;
    return mq && mc;
  });

  // Apply sorting
  const showing = [...filtered].sort((a, b) => sort === 'pAsc' ? (a.price - b.price) : sort === 'pDesc' ? (b.price - a.price) : 0);

  // Handlers
  const handleBuyNow = (id) => {
    if (!user) { navigate('/login'); return; }
    addToCart(id, 1);
    navigate('/cart');
  };

  const handleOpen = (id) => navigate(`/item/${id}`);

  const handleToggleFav = (e, id) => {
      e.stopPropagation();
      if(!user) { navigate('/login'); return; }
      toggleFav(id);
  };

  const handleAddToCart = (e, id) => {
      // e.stopPropagation() prevents clicking the card itself (which opens details)
      if (e) e.stopPropagation(); 
      addToCart(id);
  };

  const handleBidClick = (e, id) => {
      if (e) e.stopPropagation();
      handleOpen(id);
  };

  // Internal Component for this page
  const ProductCard = ({ it }) => (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col group cursor-pointer" onClick={() => handleOpen(it.id)}>
      <div className="relative">
        <img src={it.image || PLACEHOLDER_IMG} alt={it.title} className="w-full h-48 object-cover rounded-t-lg" />
        
        {/* Type Badge */}
        {it.saleType === 'auc' ? (
          <span className="absolute top-2 left-2 bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full">{L.auction}</span>
        ) : (
          <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">{L.buyNowBadge}</span>
        )}

        {/* Favorite Button */}
        <button onClick={(e) => handleToggleFav(e, it.id)} className="absolute top-2 right-2 bg-white/70 backdrop-blur-sm p-1.5 rounded-full text-gray-600 hover:text-red-500 hover:bg-white transition-all" title={isFav(it.id) ? L.favRemove : L.favAdd}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={isFav(it.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isFav(it.id) ? 'text-red-500' : ''}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-sm text-gray-500 mb-1">{tCategory(it.category, loc)} {it.subCategory && <span className="text-gray-400">&gt; {tSubCategory(it.subCategory, loc)}</span>}</h3>
        <div className="flex-grow">
          <h2 className="text-md font-bold text-gray-800 group-hover:text-purple-700 transition-colors">{it.title}</h2>
          <p className="text-xs text-gray-500 mt-1">{formatCondition(it.condition, loc, it.conditionDetail)}</p>
        </div>
        <div className="mt-4">
          {it.saleType === 'auc' ? (
            <div>
              <p className="text-xs text-gray-500">{loc === 'en' ? 'Current Bid' : 'Oferta Actual'}</p>
              <p className="text-xl font-black text-gray-900">{CRC(it.currentBid, loc, itemCurrency(it))}</p>
              {it.shippingShip && it.shippingCost > 0 && <p className="text-xs text-gray-500">+ {CRC(it.shippingCost, loc, itemCurrency(it))} {L.shipping}</p>}
              {it.buyNowPrice && <p className="text-xs text-gray-500 mt-1">{L.buyNow}: {CRC(it.buyNowPrice, loc, itemCurrency(it))}</p>}
              <div className="mt-2">
                <CountdownTimer targetDate={it.endAt} loc={loc} />
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-500">{loc === 'en' ? 'Price' : 'Precio'}</p>
              <p className="text-xl font-black text-gray-900">{CRC(it.price, loc, itemCurrency(it))}</p>
              {it.shippingShip && it.shippingCost > 0 && <p className="text-xs text-gray-500">+ {CRC(it.shippingCost, loc, itemCurrency(it))} {L.shipping}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 pt-0">
        {it.saleType === 'auc' ? (
          <div className="flex items-center gap-2">
            <button className="w-full bg-indigo-100 text-indigo-700 py-2 rounded-lg font-semibold hover:bg-indigo-200 transition-colors" onClick={(e) => handleBidClick(e, it.id)}>
              {L.placeBid}
            </button>
            {it.buyNowPrice && (
              <button className="w-full bg-indigo-500 text-white py-2 rounded-lg font-semibold hover:bg-indigo-600 transition-colors" onClick={(e) => { e.stopPropagation(); handleBuyNow(it.id); }}>
                {L.buyNow}
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button className="w-full bg-purple-100 text-purple-700 py-2 rounded-lg font-semibold hover:bg-purple-200 transition-colors" onClick={(e) => handleAddToCart(e, it.id)}>
              {L.add}
            </button>
            <button className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors" onClick={(e) => { e.stopPropagation(); handleBuyNow(it.id); }}>
              {L.buyNow}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="home-filter-bar">
          <input 
            className="home-filter-search border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 p-2.5 border" 
            placeholder={loc === 'en' ? 'Search items…' : 'Buscar artículos…'} 
            value={q} 
            onChange={e => setQ(e.target.value)} 
          />
          <select 
            className="home-filter-category border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 p-2.5 border text-sm" 
            value={cat} 
            onChange={e => setCat(e.target.value)}
          >
            {allCats.map(c => (
              <option key={c} value={c}>{c === '*' ? (loc === 'en' ? 'All Categories' : 'Todas las Categorías') : tCategory(c, loc)}</option>
            ))}
          </select>
          <select 
            className="home-filter-sort border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 p-2.5 border text-sm" 
            value={sort} 
            onChange={e => setSort(e.target.value)}
          >
            <option value="newest">{L.newest}</option>
            <option value="pAsc">{L.pAsc}</option>
            <option value="pDesc">{L.pDesc}</option>
          </select>
        </div>
        <nav className="home-category-links mt-3 pt-3 border-t border-gray-100" aria-label={loc === 'en' ? 'Browse by category' : 'Explorar por categoría'}>
          <div className="home-category-links-inner">
            <button type="button" onClick={() => setCat('*')} className={categoryLinkClass('*')}>
              {L.allCategories}
            </button>
            {categoryKeys.map((key) => (
              <button type="button" key={key} onClick={() => setCat(key)} className={categoryLinkClass(key)}>
                {tCategory(key, loc)}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {showing.map(it => <ProductCard key={it.id} it={it} />)}
        {showing.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-16">
            <h3 className="text-xl font-semibold">{L.none}</h3>
            <p>{L.adjustFilters}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;