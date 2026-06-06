import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useItems } from '../context/ItemsContext';
import { StarRating, calculateAverageRating } from '../components/Shared';
import ProductCard from '../components/ProductCard';

const SellerProfilePage = ({ loc }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { users } = useAuth();
    const { items, isFav, toggleFav } = useItems();
    
    const seller = users[id];
    const L = loc === 'en' ? {
        title: "'s Profile",
        listings: "'s Listings",
        noListings: "This seller has no active listings.",
        back: "Back",
        reviewsTitle: "Seller Reviews",
        notFound: "Seller not found.",
        reviewsFrom: "from",
        reviews: "reviews",
        anonymous: "Anonymous",
        noReviews: "No reviews yet.",
    } : {
        title: "Perfil de",
        listings: "Artículos de",
        noListings: "Este vendedor no tiene artículos activos.",
        back: "Atrás",
        reviewsTitle: "Reseñas del Vendedor",
        notFound: "Vendedor no encontrado.",
        reviewsFrom: "de",
        reviews: "reseñas",
        anonymous: "Anónimo",
        noReviews: "Aún no hay reseñas.",
    };

    const sellerItems = useMemo(() => items.filter(item => item.sellerId === seller?.id), [items, seller]);
    const averageRating = useMemo(() => calculateAverageRating(seller?.reviews), [seller]);

    const handleOpen = (itemId) => {
        navigate(`/item/${itemId}`);
    };

    if (!seller) {
        return (
            <div>
                <button className="text-purple-600 font-semibold mb-4 inline-flex items-center" onClick={() => navigate('/')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    {L.back}
                </button>
                <div className="bg-white p-8 rounded-lg shadow-md text-center">{L.notFound}</div>
            </div>
        );
    }

    return (
        <div>
            <button className="text-purple-600 font-semibold mb-4 inline-flex items-center" onClick={() => navigate('/')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                {L.back}
            </button>
            <div className="bg-white p-6 rounded-lg shadow-md border mb-6">
                <h1 className="text-3xl font-bold">{loc === 'en' ? `${seller.profileName}${L.title}` : `${L.title} ${seller.profileName}`}</h1>
                <div className="flex items-center gap-2 mt-2">
                    <StarRating rating={averageRating} />
                    <span className="text-gray-600">({averageRating.toFixed(1)} {L.reviewsFrom} {seller.reviews.length} {L.reviews})</span>
                </div>
                <p className="text-gray-500 mt-1">{`${seller.city}, ${seller.province}`}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border mb-6">
                <h2 className="text-2xl font-bold mb-4">{L.reviewsTitle}</h2>
                <div className="space-y-4">
                    {seller.reviews.map((review, index) => {
                        const reviewer = users[review.from];
                        return (
                            <div key={index} className="border-b pb-4">
                                <div className="flex items-center mb-1">
                                    <StarRating rating={review.rating} />
                                    <p className="ml-2 font-bold">{reviewer?.profileName || L.anonymous}</p>
                                </div>
                                <p className="text-gray-600">{review.comment}</p>
                            </div>
                        );
                    })}
                    {seller.reviews.length === 0 && <p className="text-gray-500">{L.noReviews}</p>}
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">{loc === 'en' ? `${seller.profileName}${L.listings}` : `${L.listings} ${seller.profileName}`} ({sellerItems.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {sellerItems.length > 0 ? (
                    sellerItems.map(it => <ProductCard key={it.id} it={it} onOpen={handleOpen} loc={loc} isFav={isFav} onToggleFav={toggleFav} />)
                ) : (
                    <div className="col-span-full text-center text-gray-500 py-16">
                        <h3 className="text-xl font-semibold">{L.noListings}</h3>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SellerProfilePage;