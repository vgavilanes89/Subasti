import React, { useState } from 'react';
import { submitReview } from '../api/reviews';

// "Leave a review" on a settled order in the buyer's purchase history.
const ReviewForm = ({ order, loc, onReviewed }) => {
    const [open, setOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const L = loc === 'en' ? {
        leave: 'Leave a review',
        rating: 'Your rating',
        stars: (n) => `${n} out of 5 stars`,
        comment: 'What was it like buying from this seller? (optional)',
        note: 'Reviews are public, with your profile name, and can\'t be edited.',
        send: 'Post review',
        pick: 'Choose a number of stars.',
        failed: 'Could not post your review. Please try again.',
    } : {
        leave: 'Dejar una reseña',
        rating: 'Tu calificación',
        stars: (n) => `${n} de 5 estrellas`,
        comment: '¿Cómo fue comprarle a este vendedor? (opcional)',
        note: 'Las reseñas son públicas, con tu nombre de perfil, y no se pueden editar.',
        send: 'Publicar reseña',
        pick: 'Elige cuántas estrellas.',
        failed: 'No se pudo publicar tu reseña. Intenta de nuevo.',
    };

    if (!open) {
        return (
            <button type="button" className="seller-action-btn" onClick={() => setOpen(true)}>
                {L.leave}
            </button>
        );
    }

    const handleSend = async () => {
        if (!rating) { setError(L.pick); return; }
        setSending(true);
        setError('');
        try {
            await submitReview(order.id, rating, comment);
            onReviewed(order.id);
        } catch (err) {
            if (err.message === 'ALREADY_REVIEWED') { onReviewed(order.id); return; }
            setError(L.failed);
            setSending(false);
        }
    };

    return (
        <div className="buyer-claim-form review-form">
            <div className="review-stars" role="radiogroup" aria-label={L.rating}>
                {[1, 2, 3, 4, 5].map((n) => (
                    <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={rating === n}
                        aria-label={L.stars(n)}
                        className={n <= rating ? 'review-star review-star--on' : 'review-star'}
                        onClick={() => { setRating(n); setError(''); }}
                    >
                        ★
                    </button>
                ))}
            </div>
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={L.comment}
                aria-label={L.comment}
                maxLength={500}
                rows={3}
                className="seller-input"
            />
            <p className="text-xs text-gray-500">{L.note}</p>
            {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
            <button type="button" className="seller-action-btn" disabled={sending} onClick={handleSend}>
                {sending ? '…' : L.send}
            </button>
        </div>
    );
};

export default ReviewForm;
