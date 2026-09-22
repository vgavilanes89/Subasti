import React, { useState, useEffect } from 'react';

// --- Constants ---
export const PLACEHOLDER_IMG = 'https://placehold.co/600x400/e2e8f0/e2e8f0';

// --- Helper Functions ---
export const itemCurrency = (item) => item?.currency || 'CRC';

export const formatMoney = (n, loc, currency = 'CRC') => {
    const amount = Number(n);
    if (!Number.isFinite(amount)) return '';
    try {
        const locale = loc === 'en' ? 'en-US' : 'es-CR';
        const isUsd = currency === 'USD';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            maximumFractionDigits: isUsd ? 2 : 0,
            minimumFractionDigits: isUsd ? 2 : 0,
        }).format(amount);
    } catch {
        return currency === 'USD' ? `$${amount.toFixed(2)}` : `₡${Math.round(amount)}`;
    }
};

/** @deprecated Use formatMoney(n, loc, currency) — kept for existing call sites */
export const CRC = (n, loc, currency = 'CRC') => formatMoney(n, loc, currency);

export const formatMoneyTotals = (amountsByCurrency, loc) =>
    Object.entries(amountsByCurrency)
        .filter(([, total]) => total > 0)
        .map(([currency, total]) => formatMoney(total, loc, currency))
        .join(' + ');

export const calculateAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) {
        return 0;
    }
    const total = reviews.reduce((acc, review) => acc + review.rating, 0);
    return total / reviews.length;
};

// --- Hooks ---
export const useCountdown = (targetDate) => {
    const countDownDate = new Date(targetDate).getTime();

    const [countDown, setCountDown] = useState(
        countDownDate - new Date().getTime()
    );

    useEffect(() => {
        const interval = setInterval(() => {
            setCountDown(countDownDate - new Date().getTime());
        }, 1000);

        return () => clearInterval(interval);
    }, [countDownDate]);

    return getReturnValues(countDown);
};

const getReturnValues = (countDown) => {
    if (countDown < 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isFinished: true };
    }
    const days = Math.floor(countDown / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
        (countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((countDown % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, isFinished: false };
};

// --- Components ---

export const CountdownTimer = ({ targetDate, loc }) => {
    const { days, hours, minutes, seconds, isFinished } = useCountdown(targetDate);
    const L = loc === 'en' ? { d: 'd', h: 'h', m: 'm', s: 's', ended: 'Auction Ended' } : { d: 'd', h: 'h', m: 'm', s: 's', ended: 'Subasta Terminada' };

    if (isFinished) {
        return <div className="text-red-500 font-bold">{L.ended}</div>;
    }

    return (
        <div className="flex items-center space-x-2 text-sm font-mono bg-gray-100 px-2 py-1 rounded">
            <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 text-gray-500"><path d="M10 2h4"/><path d="M12 14v-4"/><path d="M4 14a8 8 0 1 1 16 0c0 4.25-6 6-6 6H10c0 0-6-1.75-6-6Z"/></svg>
                <span className="font-semibold">{String(days).padStart(2, '0')}{L.d}</span>:
                <span className="font-semibold">{String(hours).padStart(2, '0')}{L.h}</span>:
                <span className="font-semibold">{String(minutes).padStart(2, '0')}{L.m}</span>:
                <span className="font-semibold">{String(seconds).padStart(2, '0')}{L.s}</span>
            </div>
        </div>
    );
};

// Shared across BuyerDashboard and ProfilePage's overview — a compact grid
// of item thumbnails (favorites, recently viewed, etc.).
export const ProfilePageItemList = ({ list, emptyMsg, onOpen, onToggleFav, isFav, loc, L }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {list.length ? list.map(it => (
            <div key={it.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 group relative">
                <img src={it.image || PLACEHOLDER_IMG} onClick={() => onOpen(it.id)} alt={it.title} className="w-full h-24 sm:h-32 object-cover rounded-t-lg cursor-pointer" />
                {onToggleFav && isFav && (
                    <button onClick={(e) => { e.stopPropagation(); onToggleFav(it.id); }} className="absolute top-1 right-1 bg-white/70 backdrop-blur-sm p-1 rounded-full text-gray-600 hover:text-red-500 hover:bg-white transition-all" title={isFav(it.id) ? L.favRemove : L.favAdd}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isFav(it.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isFav(it.id) ? 'text-red-500' : ''}>
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                )}
                <div className="p-2">
                    <button type="button" onClick={() => onOpen(it.id)} className="text-sm font-semibold text-gray-800 hover:text-purple-700 text-left line-clamp-2">{it.title}</button>
                </div>
            </div>
        )) : <p className="col-span-full text-sm text-gray-500">{emptyMsg}</p>}
    </div>
);

// Same visual language as the stat cards elsewhere in the buyer/seller
// dashboards (.seller-stat-card), for the profile overview's stat grid.
export const StatCard = ({ label, value, sub, accent }) => (
    <div className={`seller-stat-card ${accent ? `seller-stat-card--${accent}` : ''}`}>
        <p className="seller-stat-label">{label}</p>
        <p className="seller-stat-value">{value}</p>
        {sub && <p className="seller-stat-sub">{sub}</p>}
    </div>
);

export const StarRating = ({ rating }) => {
    const totalStars = 5;
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = totalStars - fullStars - (halfStar ? 1 : 0);

    return (
        <span className="inline-flex items-center">
            {[...Array(fullStars)].map((_, i) => (
                <svg key={`full-${i}`} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279L12 18.896l-7.416 4.517 1.48-8.279-6.064-5.828 8.332-1.151L12 .587z"/></svg>
            ))}
            {halfStar && (
                <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24"><path d="M12 5.173l2.332 4.751 5.249.724-3.834 3.666.924 5.191L12 16.112V5.173z"/></svg>
            )}
            {[...Array(emptyStars)].map((_, i) => (
                <svg key={`empty-${i}`} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279L12 18.896l-7.416 4.517 1.48-8.279-6.064-5.828 8.332-1.151L12 .587z"/></svg>
            ))}
        </span>
    );
};