import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useItems } from '../context/ItemsContext';
import ProductCard from '../components/ProductCard';

const FavoritesPage = ({ loc }) => {
    const { items, favorites, isFav, toggleFav } = useItems();
    const navigate = useNavigate();
    
    const favoriteItems = items.filter(i => favorites.includes(i.id));
    
    const L = loc === 'en' ? {
        title: "My Favorites",
        noFavorites: "You haven't favorited any items yet.",
        browse: "Browse Items"
    } : {
        title: "Mis Favoritos",
        noFavorites: "Aún no has agregado ningún artículo a favoritos.",
        browse: "Ver Artículos"
    };

    const handleOpen = (id) => {
        navigate(`/item/${id}`);
    };

    if (!favoriteItems || favoriteItems.length === 0) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-md border text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">{L.title}</h1>
                <p className="text-gray-500 mb-6">{L.noFavorites}</p>
                <button onClick={() => navigate('/')} className="bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                    {L.browse}
                </button>
            </div>
        )
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">{L.title}</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {favoriteItems.map(it => <ProductCard key={it.id} it={it} onOpen={handleOpen} loc={loc} onToggleFav={toggleFav} isFav={isFav} />)}
            </div>
        </div>
    )
}

export default FavoritesPage;