import React, { useState } from 'react';
import { submitReview } from '../api/reviews';
import { isReviewable, reviewClosesAt } from '../data/reviewRules';

// The review part of a settled order, for either side.
// subject: who is being reviewed, 'seller' or 'buyer'.
// mine: what useMyReviews returned.
const OrderReview = ({ order, loc, subject, mine, onReviewed }) => {
    const [open, setOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    if (!mine || !isReviewable(order.status)) return null;

    const closesAt = reviewClosesAt(order);
    const closed = Date.now() > closesAt;
    const date = new Date(closesAt).toLocaleDateString(loc === 'en' ? 'en-US' : 'es-CR', { month: 'short', day: 'numeric' });
    const L = loc === 'en' ? {
        leave: subject === 'buyer' ? 'Review the buyer' : 'Leave a review',
        waiting: subject === 'buyer' ? 'The buyer reviewed you. Leave yours to see it.' : 'The seller reviewed you. Leave yours to see it.',
        closes: `Open until ${date}`,
        sent: `Review sent. It appears once they review you too, or after ${date}.`,
        done: subject === 'buyer' ? 'You reviewed this buyer' : 'You reviewed this sale',
        rating: 'Your rating',
        stars: (n) => `${n} out of 5 stars`,
        comment: subject === 'buyer' ? 'What was it like selling to this buyer? (optional)' : 'What was it like buying from this seller? (optional)',
        note: `Neither of you sees the other's review until you've both written one, or until ${date}. Reviews are public and can't be edited.`,
        send: 'Post review',
        pick: 'Choose a number of stars.',
        late: 'The time to review this order has ended.',
        failed: 'Could not post your review. Please try again.',
    } : {
        leave: subject === 'buyer' ? 'Reseñar al comprador' : 'Dejar una reseña',
        waiting: subject === 'buyer' ? 'El comprador te reseñó. Deja la tuya para verla.' : 'El vendedor te reseñó. Deja la tuya para verla.',
        closes: `Disponible hasta el ${date}`,
        sent: `Reseña enviada. Aparecerá cuando la otra persona también te reseñe, o después del ${date}.`,
        done: subject === 'buyer' ? 'Ya reseñaste a este comprador' : 'Ya reseñaste esta compra',
        rating: 'Tu calificación',
        stars: (n) => `${n} de 5 estrellas`,
        comment: subject === 'buyer' ? '¿Cómo fue venderle a este comprador? (opcional)' : '¿Cómo fue comprarle a este vendedor? (opcional)',
        note: `Ninguno ve la reseña del otro hasta que ambos escriban la suya, o hasta el ${date}. Las reseñas son públicas y no se pueden editar.`,
        send: 'Publicar reseña',
        pick: 'Elige cuántas estrellas.',
        late: 'El plazo para reseñar este pedido terminó.',
        failed: 'No se pudo publicar tu reseña. Intenta de nuevo.',
    };

    const written = mine.written[order.id];
    if (written) {
        return <p className="review-status">{written.published || closed ? L.done : L.sent}</p>;
    }
    if (closed) return null;

    const handleSend = async () => {
        if (!rating) { setError(L.pick); return; }
        setSending(true);
        setError('');
        try {
            await submitReview(order.id, rating, comment);
            onReviewed();
        } catch (err) {
            if (err.message === 'ALREADY_REVIEWED') { onReviewed(); return; }
            setError(err.message === 'REVIEW_CLOSED' ? L.late : L.failed);
            setSending(false);
        }
    };

    const waiting = mine.waiting.includes(order.id) && <p className="review-status review-status--waiting">{L.waiting}</p>;

    if (!open) {
        return (
            <>
                {waiting}
                <button type="button" className="seller-action-btn" onClick={() => setOpen(true)}>
                    {L.leave}
                </button>
                <p className="review-status">{L.closes}</p>
            </>
        );
    }

    return (
        <div className="buyer-claim-form review-form">
            {waiting}
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

export default OrderReview;
