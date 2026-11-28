import React, { useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useItems } from '../context/ItemsContext';
import { StarRating } from '../components/Shared';
import { useReviews } from '../lib/useReviews';
import { removeReview } from '../api/reviews';
import ProductCard from '../components/ProductCard';
import Avatar from '../components/Avatar';
import ReportButton from '../components/ReportButton';

const SellerProfilePage = ({ loc }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, users, ensureUserLoaded } = useAuth();
    const { items, isFav, toggleFav } = useItems();

    const seller = users[id];

    useEffect(() => {
        if (id && !users[id]) ensureUserLoaded(id);
    }, [id, users, ensureUserLoaded]);
    const L = loc === 'en' ? {
        title: "'s Profile",
        listings: "'s Listings",
        noListings: "This seller has no active listings.",
        back: "Back",
        reviewsTitle: "Seller Reviews",
        notFound: "Seller not found.",
        reviewsFrom: "from",
        reviews: "reviews",
        review: "review",
        anonymous: "Anonymous",
        noReviews: "No reviews yet.",
        remove: "Remove review",
        confirmRemove: "Remove this review for everyone?",
        removeFailed: "Could not remove the review.",
        asSeller: "As a seller",
        asBuyerLabel: "As a buyer",
        buyerReviewsTitle: "Reviews as a Buyer",
    } : {
        title: "Perfil de",
        listings: "Artículos de",
        noListings: "Este vendedor no tiene artículos activos.",
        back: "Atrás",
        reviewsTitle: "Reseñas del Vendedor",
        notFound: "Vendedor no encontrado.",
        reviewsFrom: "de",
        reviews: "reseñas",
        review: "reseña",
        anonymous: "Anónimo",
        noReviews: "Aún no hay reseñas.",
        remove: "Quitar reseña",
        confirmRemove: "¿Quitar esta reseña para todos?",
        removeFailed: "No se pudo quitar la reseña.",
        asSeller: "Como vendedor",
        asBuyerLabel: "Como comprador",
        buyerReviewsTitle: "Reseñas como Comprador",
    };

    const sellerItems = useMemo(() => items.filter(item => item.sellerId === seller?.id), [items, seller]);
    const { reviews, count, average, loaded, reload } = useReviews(id, 'seller');
    const asBuyer = useReviews(id, 'buyer');

    const handleRemoveReview = async (reviewId) => {
        if (!window.confirm(L.confirmRemove)) return;
        try {
            await removeReview(reviewId);
            reload();
            asBuyer.reload();
        } catch {
            alert(L.removeFailed);
        }
    };

    const handleOpen = (itemId) => {
        navigate(`/item/${itemId}`);
    };

    if (!seller) {
        return (
            <div>
                <button className="tap-target text-purple-600 font-semibold mb-4 inline-flex items-center" onClick={() => navigate('/')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    {L.back}
                </button>
                <div className="bg-white p-8 rounded-lg shadow-md text-center">{L.notFound}</div>
            </div>
        );
    }

    const ratingLine = (label, value, total) => total > 0 && (
        <div className="flex items-center flex-wrap gap-2 mt-2">
            <span className="text-sm font-semibold text-gray-700">{label}:</span>
            <StarRating rating={value} />
            <span className="text-gray-600">({value.toFixed(1)} {L.reviewsFrom} {total} {total === 1 ? L.review : L.reviews})</span>
        </div>
    );

    const renderReview = (review) => (
        <div key={review.id} className="border-b pb-4">
            <div className="flex items-center flex-wrap gap-2 mb-1">
                <StarRating rating={review.rating} />
                <p className="font-bold">{review.from || L.anonymous}</p>
                <p className="text-xs text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString(loc === 'en' ? 'en-US' : 'es-CR', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {review.itemTitle ? ` · ${review.itemTitle}` : ''}
                </p>
            </div>
            {review.comment && <p className="text-gray-600 break-words">{review.comment}</p>}
            {user?.isAdmin && (
                <button type="button" className="tap-target text-xs text-red-700 hover:underline mt-1" onClick={() => handleRemoveReview(review.id)}>{L.remove}</button>
            )}
        </div>
    );

    return (
        <div>
            <button className="text-purple-600 font-semibold mb-4 inline-flex items-center" onClick={() => navigate('/')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                {L.back}
            </button>
            <div className="bg-white p-6 rounded-lg shadow-md border mb-6">
                <div className="flex items-center gap-4">
                    <Avatar name={seller.profileName} src={seller.avatarUrl} size={72} />
                    <h1 className="text-3xl font-bold">{loc === 'en' ? `${seller.profileName}${L.title}` : `${L.title} ${seller.profileName}`}</h1>
                </div>
                {ratingLine(L.asSeller, average, count)}
                {ratingLine(L.asBuyerLabel, asBuyer.average, asBuyer.count)}
                <p className="text-gray-500 mt-1">{`${seller.city}, ${seller.province}`}</p>
                {user?.id !== seller.id && !seller.isAdmin && (
                    <div className="mt-3">
                        <ReportButton key={seller.id} targetType="user" targetId={seller.id} loc={loc} />
                    </div>
                )}
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border mb-6">
                <h2 className="text-2xl font-bold mb-4">{L.reviewsTitle}</h2>
                <div className="space-y-4">
                    {reviews.map(renderReview)}
                    {loaded && reviews.length === 0 && <p className="text-gray-500">{L.noReviews}</p>}
                </div>
            </div>

            {asBuyer.count > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-md border mb-6">
                    <h2 className="text-2xl font-bold mb-4">{L.buyerReviewsTitle}</h2>
                    <div className="space-y-4">{asBuyer.reviews.map(renderReview)}</div>
                </div>
            )}

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