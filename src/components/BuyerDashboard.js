import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLACEHOLDER_IMG, formatMoney, StatCard, ProfilePageItemList, CountdownTimer } from './Shared';
import { useMessages } from '../context/MessagesContext';
import ChatPanel from './ChatPanel';
import * as ordersApi from '../api/orders';
import { fetchMyBids } from '../api/bids';
import BuyerOffersSection from './BuyerOffersSection';
import { buyerStatusLabel, orderStatusClass } from '../data/escrow';
import EscrowPanel from './EscrowPanel';
import PayOrderModal from './PayOrderModal';
import { useEnsureUsers } from '../lib/useEnsureUsers';
import { useRefreshOnNotification } from '../lib/useRefreshOnNotification';
import { acceptedMethods } from '../data/paymentMethods';
import ReviewForm from './ReviewForm';
import { fetchMyReviewedOrders } from '../api/reviews';

// Where an auction stands for this bidder. Ended auctions are judged from the
// item's own endAt, so the badge flips the moment the clock runs out even
// before the next refresh.
export const bidStatus = (item, userId, now = Date.now()) => {
    const ended = Boolean(item.endAt) && item.endAt < now;
    const isTop = item.highestBidderId === userId;
    if (!ended) return isTop ? 'winning' : 'outbid';
    if (!isTop) return 'lost';
    // Not known yet if this data was fetched before the auction ended.
    if (item.reserveMet === null) return 'ended';
    return item.reserveMet === false ? 'reserve' : 'won';
};

const BID_BADGE = {
    winning: 'seller-badge seller-badge--ok',
    outbid: 'seller-badge seller-badge--danger',
    won: 'seller-badge seller-badge--ok',
    lost: 'seller-badge',
    reserve: 'seller-badge seller-badge--warn',
    ended: 'seller-badge',
};

const BidRow = ({ entry, status, loc, L, onOpenItem }) => {
    const { item, myHighestBid } = entry;
    const active = status === 'winning' || status === 'outbid';
    return (
        <div className="seller-order-card buyer-order-card">
            <div className="seller-order-main">
                <img src={item.image || PLACEHOLDER_IMG} alt="" />
                <div className="seller-order-info">
                    <button type="button" onClick={() => onOpenItem(item.id)} className="buyer-order-title">
                        {item.title}
                    </button>
                    <p className="text-sm text-gray-600">
                        {L.yourBid}: <span className="font-semibold">{formatMoney(myHighestBid, loc, item.currency)}</span>
                        {' · '}{L.currentBid}: <span className="font-semibold">{formatMoney(item.currentBid ?? item.price, loc, item.currency)}</span>
                        {' · '}{item.bids} {item.bids === 1 ? L.bidOne : L.bidsCount}
                    </p>
                    {active && item.endAt && (
                        <div className="mt-1"><CountdownTimer targetDate={item.endAt} loc={loc} /></div>
                    )}
                    {status === 'won' && <p className="text-xs text-purple-600 font-semibold mt-1">{L.wonHint}</p>}
                    {status === 'reserve' && <p className="text-xs text-gray-500 mt-1">{L.reserveHint}</p>}
                </div>
            </div>
            <div className="bid-row-actions">
                <span className={BID_BADGE[status]}>{L['bidStatus_' + status]}</span>
                {status === 'outbid' && (
                    <button type="button" className="seller-action-btn" onClick={() => onOpenItem(item.id)}>{L.bidAgain}</button>
                )}
            </div>
        </div>
    );
};

const BuyerOrderCard = ({
    order,
    loc,
    users,
    L,
    onPay,
    onConfirmReceived,
    onReleaseFunds,
    onSubmitClaim,
    onOpenItem,
    onMessageSeller,
    claiming,
    canReview,
    reviewed,
    onReviewed,
}) => {
    const [claimDraft, setClaimDraft] = useState('');
    const [showClaimForm, setShowClaimForm] = useState(false);
    const seller = users[order.sellerId];
    const total = order.amount + (order.shippingCost || 0);
    // Claims are only accepted for 48 hours after the item is marked received.
    const claimOpen = !order.confirmationDueAt || Date.now() <= order.confirmationDueAt;

    const formatDateTime = (ts) => new Date(ts).toLocaleString(loc === 'en' ? 'en-US' : 'es-CR', {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });

    const formatDate = (ts) => {
        if (!ts) return '—';
        return new Date(ts).toLocaleDateString(loc === 'en' ? 'en-US' : 'es-CR', {
            month: 'short', day: 'numeric', year: 'numeric',
        });
    };

    return (
        <div className="seller-order-card buyer-order-card">
            <div className="seller-order-main">
                <img src={order.image || PLACEHOLDER_IMG} alt="" />
                <div className="seller-order-info">
                    <button type="button" onClick={() => onOpenItem(order.itemId)} className="buyer-order-title">
                        {order.itemTitle}
                    </button>
                    <p className="text-sm text-gray-600">
                        {L.seller}: <span className="font-medium">{seller?.profileName || '—'}</span>
                        {' · '}{L.purchased}: {formatDate(order.purchasedAt)}
                    </p>
                    {order.orderType === 'auction_won' && (
                        <p className="text-xs text-purple-600 font-semibold">{L.auctionWon}</p>
                    )}
                    <p className="text-sm text-gray-600">
                        {order.fulfillment === 'ship' ? L.fulfillmentShip : L.fulfillmentPickup}
                        {order.status === 'pending_payment' && order.paymentDueAt && (
                            <> · {L.payBy} {formatDate(order.paymentDueAt)}</>
                        )}
                        {order.status === 'escrow_held' && (
                            <span className="block text-xs text-purple-600 font-medium mt-0.5">{L.escrowHeld}</span>
                        )}
                        {order.shippingTimeframe && (
                            <> · {L.shipTimeframe}: {order.shippingTimeframe}</>
                        )}
                        {order.status === 'shipped' && order.estimatedDelivery && (
                            <> · {L.estDelivery} {formatDate(order.estimatedDelivery)}</>
                        )}
                        {order.status === 'awaiting_confirmation' && order.confirmationDueAt && (
                            <> · {Date.now() <= order.confirmationDueAt ? `${L.claimBy} ${formatDateTime(order.confirmationDueAt)}` : `${L.claimEnded} ${formatDateTime(order.confirmationDueAt)}`}</>
                        )}
                    </p>
                    <p className="text-sm font-bold text-purple-700 mt-1">
                        {formatMoney(total, loc, order.currency)}
                        {order.shippingCost > 0 && order.fulfillment === 'ship' && (
                            <span className="text-gray-500 font-normal text-xs ml-1">
                                ({L.includesShipping})
                            </span>
                        )}
                    </p>
                    {order.trackingNumber && (
                        <p className="text-xs text-gray-600 mt-1">
                            {L.tracking}: <span className="font-mono font-semibold">{order.trackingNumber}</span>
                        </p>
                    )}
                    {order.paymentMethod && (
                        <p className="text-xs text-gray-500">{L.paidWith}: {order.paymentMethod}</p>
                    )}
                </div>
            </div>
            <div className="seller-order-actions">
                <span className={orderStatusClass(order.status)}>
                    {buyerStatusLabel(order, loc)}
                </span>
                {order.status === 'pending_payment' && (
                    <button
                        type="button"
                        onClick={() => onPay(order.id)}
                        className="seller-action-btn"
                    >
                        {order.paymentReportedAt ? L.paymentDetails : L.payNow}
                    </button>
                )}
                {order.status === 'shipped' && (
                    <button
                        type="button"
                        onClick={() => onConfirmReceived(order.id)}
                        className="seller-action-btn seller-action-btn--secondary"
                    >
                        {L.markReceived}
                    </button>
                )}
                {order.status === 'awaiting_confirmation' && (
                    <>
                        <button type="button" onClick={() => onReleaseFunds(order.id)} className="seller-action-btn">
                            {L.releaseFunds}
                        </button>
                        {claimOpen ? (
                            <button
                                type="button"
                                onClick={() => setShowClaimForm(s => !s)}
                                className="buyer-order-link-btn"
                            >
                                {L.fileClaim}
                            </button>
                        ) : (
                            <p className="text-xs text-gray-500 max-w-[14rem] text-right">{L.claimClosed}</p>
                        )}
                        {claimOpen && showClaimForm && (
                            <div className="buyer-claim-form">
                                <textarea
                                    value={claimDraft}
                                    onChange={e => setClaimDraft(e.target.value)}
                                    placeholder={L.claimPlaceholder}
                                    rows={3}
                                    className="seller-input"
                                />
                                <button
                                    type="button"
                                    disabled={!claimDraft.trim() || claiming === order.id}
                                    onClick={() => onSubmitClaim(order.id, claimDraft, () => { setClaimDraft(''); setShowClaimForm(false); })}
                                    className="seller-action-btn seller-action-btn--secondary"
                                >
                                    {claiming === order.id ? '…' : L.submitClaim}
                                </button>
                            </div>
                        )}
                    </>
                )}
                {canReview && <ReviewForm order={order} loc={loc} onReviewed={onReviewed} />}
                {reviewed && <p className="text-xs text-gray-500">{loc === 'en' ? 'You reviewed this sale' : 'Ya reseñaste esta compra'}</p>}
                <button
                    type="button"
                    onClick={() => onMessageSeller(order)}
                    className="buyer-order-link-btn"
                >
                    {L.messageSeller}
                </button>
            </div>
        </div>
    );
};

const BuyerDashboard = ({
    user,
    users,
    items,
    loc,
    favorites,
    toggleFav,
    isFav,
    activeThreadId,
    onSelectThread,
    chatOpenThreadId = null,
}) => {
    const navigate = useNavigate();
    const { buyerThreads, getOrCreateThread } = useMessages();
    const [orders, setOrders] = useState([]);
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(null);
    const [payingOrder, setPayingOrder] = useState(null);
    // null until known (or if reviews aren't available), so no order offers a review twice.
    const [reviewedIds, setReviewedIds] = useState(null);
    useEffect(() => {
        fetchMyReviewedOrders()
            .then((r) => setReviewedIds(r.available ? r.orderIds : null))
            .catch(() => {});
    }, [user.id]);
    const handleReviewed = (orderId) => setReviewedIds(prev => [...(prev || []), orderId]);

    useEnsureUsers(orders.map(o => o.sellerId));

    const L = loc === 'en' ? {
        dashboard: 'Buying Dashboard',
        pendingPayment: 'Awaiting payment',
        inTransit: 'In transit',
        activeOrders: 'Active orders',
        pickupScheduled: 'Pickups scheduled',
        notices: 'Action needed',
        payNotice: 'order(s) require payment to complete your purchase.',
        myBids: 'My Bids',
        noBids: "You haven't bid on any auctions yet.",
        activeBidsHeading: 'Active auctions',
        endedBidsHeading: 'Ended auctions',
        yourBid: 'Your bid',
        currentBid: 'Current bid',
        bidsCount: 'bids',
        bidOne: 'bid',
        bidAgain: 'Bid again',
        bidStatus_winning: "You're winning",
        bidStatus_outbid: 'Outbid',
        bidStatus_won: 'You won',
        bidStatus_lost: 'Not won',
        bidStatus_reserve: 'Reserve not met',
        bidStatus_ended: 'Auction ended',
        wonHint: 'Complete payment under "Awaiting payment" above.',
        reserveHint: 'The reserve price was not reached. As the highest bidder, the seller may offer you the item.',
        outbidNotice: 'auction(s) where you have been outbid.',
        shipNotice: 'item(s) are on the way to you.',
        pickupNotice: 'pickup(s) ready to schedule with the seller.',
        noNotices: 'No urgent buyer actions right now.',
        pendingPayments: 'Payment required',
        noPendingPayments: 'No outstanding payments.',
        awaitingShipment: 'Paid — awaiting shipment',
        shipping: 'Shipping to you',
        noShipping: 'Nothing in transit.',
        pickups: 'Scheduled pickups',
        noPickups: 'No pickups scheduled.',
        history: 'Purchase history',
        noHistory: 'No completed purchases yet.',
        seller: 'Seller',
        purchased: 'Purchased',
        payNow: 'Pay now',
        paymentDetails: 'Payment details',
        sinpeReported: 'Thanks! Subasti is verifying your SINPE transfer. We will notify you as soon as it is confirmed.',
        payBy: 'Pay by',
        estDelivery: 'Est. delivery',
        pickupBy: 'Pickup by',
        tracking: 'Tracking',
        paidWith: 'Paid with',
        paySuccess: 'Payment recorded! The seller has been notified.',
        receivedSuccess: 'Marked as received. You have 48 hours to release funds or file a claim.',
        releaseSuccess: 'Funds released to the seller. Thank you!',
        claimSuccess: 'Claim submitted. Subasti will review and email you updates.',
        escrowNotice: 'order(s) need you to release funds or file a claim within 48 hours.',
        messageSeller: 'Message seller',
        sellerMessages: 'Messages with sellers',
        favs: 'My Favorites',
        noFavs: 'You have no favorite items.',
        favAdd: 'Add to favorites',
        favRemove: 'Remove from favorites',
        markReceived: 'Mark received',
        releaseFunds: 'Release funds to seller',
        fileClaim: 'File a claim',
        submitClaim: 'Submit claim',
        claimPlaceholder: 'Describe how the item differs from the listing or suspected fraud…',
        claimBy: 'Claim or release by',
        claimEnded: 'Claim window ended',
        claimClosed: 'The 48-hour claim window has closed.',
        claimFailed: 'We could not send your claim. Please try again.',
        releaseFailed: 'We could not release the funds. The order may have changed; please check it and try again.',
        shipTimeframe: 'Est. delivery',
        escrowHeld: 'Payment secured in Subasti escrow',
        escrowSection: 'Confirm or claim',
        noEscrow: 'No orders awaiting your confirmation.',
        fulfillmentShip: 'Shipping',
        fulfillmentPickup: 'Local pickup',
        auctionWon: 'Auction won',
        includesShipping: 'incl. shipping',
        orders: 'orders',
    } : {
        dashboard: 'Panel de Compras',
        pendingPayment: 'Esperando pago',
        inTransit: 'En tránsito',
        activeOrders: 'Pedidos activos',
        pickupScheduled: 'Recogidas programadas',
        notices: 'Acción requerida',
        payNotice: 'pedido(s) requieren pago para completar la compra.',
        myBids: 'Mis Pujas',
        noBids: 'Aún no has pujado en ninguna subasta.',
        activeBidsHeading: 'Subastas activas',
        endedBidsHeading: 'Subastas terminadas',
        yourBid: 'Tu puja',
        currentBid: 'Puja actual',
        bidsCount: 'pujas',
        bidOne: 'puja',
        bidAgain: 'Pujar de nuevo',
        bidStatus_winning: 'Vas ganando',
        bidStatus_outbid: 'Te superaron',
        bidStatus_won: 'Ganaste',
        bidStatus_lost: 'No ganada',
        bidStatus_reserve: 'Reserva no alcanzada',
        bidStatus_ended: 'Subasta terminada',
        wonHint: 'Completa el pago en "Esperando pago" arriba.',
        reserveHint: 'No se alcanzó el precio de reserva. Como mejor postor, el vendedor puede ofrecerte el artículo.',
        outbidNotice: 'subasta(s) donde te superaron la puja.',
        shipNotice: 'artículo(s) están en camino.',
        pickupNotice: 'recogida(s) listas para coordinar con el vendedor.',
        noNotices: 'No hay acciones urgentes por ahora.',
        pendingPayments: 'Pago requerido',
        noPendingPayments: 'No hay pagos pendientes.',
        awaitingShipment: 'Pagado — esperando envío',
        shipping: 'Envíos hacia ti',
        noShipping: 'Nada en tránsito.',
        pickups: 'Recogidas programadas',
        noPickups: 'No hay recogidas programadas.',
        history: 'Historial de compras',
        noHistory: 'Aún no hay compras completadas.',
        seller: 'Vendedor',
        purchased: 'Comprado',
        payNow: 'Pagar ahora',
        paymentDetails: 'Datos del pago',
        sinpeReported: '¡Gracias! Subasti está verificando tu transferencia SINPE. Te avisaremos apenas se confirme.',
        payBy: 'Pagar antes de',
        estDelivery: 'Entrega est.',
        pickupBy: 'Recoger antes de',
        tracking: 'Rastreo',
        paidWith: 'Pagado con',
        paySuccess: '¡Pago registrado! El vendedor fue notificado.',
        receivedSuccess: 'Marcado como recibido. Tiene 48 horas para liberar fondos o reclamar.',
        releaseSuccess: 'Fondos liberados al vendedor. ¡Gracias!',
        claimSuccess: 'Reclamo enviado. Subasti revisará y le escribirá por correo.',
        escrowNotice: 'pedido(s) requieren liberar fondos o reclamar en 48 horas.',
        messageSeller: 'Mensaje al vendedor',
        sellerMessages: 'Mensajes con vendedores',
        favs: 'Mis Favoritos',
        noFavs: 'No tienes artículos favoritos.',
        favAdd: 'Agregar a favoritos',
        favRemove: 'Quitar de favoritos',
        markReceived: 'Marcar recibido',
        releaseFunds: 'Liberar fondos al vendedor',
        fileClaim: 'Presentar reclamo',
        submitClaim: 'Enviar reclamo',
        claimPlaceholder: 'Describa en qué difiere el artículo de la publicación o el fraude…',
        claimBy: 'Reclamar o liberar antes de',
        claimEnded: 'El plazo de reclamo venció',
        claimClosed: 'El plazo de 48 horas para reclamar ya venció.',
        claimFailed: 'No pudimos enviar tu reclamo. Inténtalo de nuevo.',
        releaseFailed: 'No pudimos liberar los fondos. El pedido pudo haber cambiado; revísalo e inténtalo de nuevo.',
        shipTimeframe: 'Entrega est.',
        escrowHeld: 'Pago asegurado en depósito Subasti',
        escrowSection: 'Confirmar o reclamar',
        noEscrow: 'No hay pedidos esperando su confirmación.',
        fulfillmentShip: 'Envío',
        fulfillmentPickup: 'Recogida local',
        auctionWon: 'Subasta ganada',
        includesShipping: 'incl. envío',
        orders: 'pedidos',
    };

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            const [data, myBids] = await Promise.all([
                ordersApi.fetchBuyerOrders(user.id),
                fetchMyBids().catch(() => []),
            ]);
            if (!cancelled) {
                setOrders(data);
                setBids(myBids);
                setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [user.id]);

    useRefreshOnNotification(() => {
        ordersApi.fetchBuyerOrders(user.id).then(setOrders).catch(() => {});
        // An outbid notification arrives exactly when this list changes.
        fetchMyBids().then(setBids).catch(() => {});
    });

    // Items/bids live only in the client (never persisted), so this is the
    // only place that can notice "an auction I won just ended" and turn it
    // into a real, payable order — done lazily on view since there's no
    // backend job that could watch for it instead.
    useEffect(() => {
        if (!items.length) return;
        const now = Date.now();
        const won = items.filter(item =>
            item.saleType === 'auc' &&
            item.endAt < now &&
            item.highestBidderId === user.id &&
            item.reserveMet !== false // the server checks the reserve itself
        );
        if (won.length === 0) return;

        let cancelled = false;
        Promise.all(won.map(item =>
            fetch('/api/orders/settle-auction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId: item.id }),
            }).then(res => (res.ok ? res.json() : null))
        )).then(newOrders => {
            if (cancelled) return;
            const created = newOrders.filter(Boolean);
            if (created.length === 0) return;
            setOrders(prev => {
                const byId = new Map(prev.map(o => [o.id, o]));
                created.forEach(o => byId.set(o.id, o));
                return [...byId.values()];
            });
        });
        return () => { cancelled = true; };
    }, [items, user.id]);

    const pendingPayment = useMemo(() => orders.filter(o => o.status === 'pending_payment'), [orders]);
    const inTransit = useMemo(() => orders.filter(o => o.status === 'shipped'), [orders]);
    const awaitingConfirmation = useMemo(() => orders.filter(o => o.status === 'awaiting_confirmation'), [orders]);
    const claimPending = useMemo(() => orders.filter(o => o.status === 'claim_pending'), [orders]);
    const escrowWaiting = useMemo(() => orders.filter(o => o.status === 'escrow_held'), [orders]);
    const completed = useMemo(() => orders.filter(o =>
        o.status === 'completed' || o.status === 'refunded' || o.status === 'cancelled'
    ), [orders]);
    const activeCount = orders.filter(o =>
        !['completed', 'cancelled', 'refunded'].includes(o.status)
    ).length;

    const now = Date.now();
    // Having a live order for it means they got it — including an accepted second-chance offer.
    const bidRows = bids.map(entry => ({
        entry,
        status: orders.some(o => o.itemId === entry.item.id && o.status !== 'cancelled') ? 'won' : bidStatus(entry.item, user.id, now),
    }));
    // Outbid first: those are the ones the buyer can still act on.
    const activeBids = bidRows
        .filter(r => r.status === 'outbid' || r.status === 'winning')
        .sort((a, b) => (a.status === b.status ? a.entry.item.endAt - b.entry.item.endAt : a.status === 'outbid' ? -1 : 1));
    const endedBids = bidRows.filter(r => r.status !== 'outbid' && r.status !== 'winning');
    const outbidCount = activeBids.filter(r => r.status === 'outbid').length;

    const myFavorites = items.filter(i => favorites.includes(i.id));

    const hasUrgent = pendingPayment.length > 0 || awaitingConfirmation.length > 0 || inTransit.length > 0 || outbidCount > 0;

    const handlePay = (orderId) => {
        const order = orders.find(o => o.id === orderId);
        if (order) setPayingOrder(order);
    };

    // A SINPE transfer was reported: the order stays unpaid until an admin confirms it,
    // so refresh instead of marking anything paid.
    const handleSinpeReported = async () => {
        try {
            setOrders(await ordersApi.fetchBuyerOrders(user.id));
        } catch {
            // the list refreshes on the next notification anyway
        }
        setPayingOrder(null);
        alert(L.sinpeReported);
    };

    const handlePaid = (updatedOrder) => {
        setOrders(prev => prev.map(o => (o.id === updatedOrder.id ? updatedOrder : o)));
        setPayingOrder(null);
        alert(L.paySuccess);
    };

    const handleConfirmReceived = async (orderId) => {
        const updated = await ordersApi.confirmOrderReceived(orderId);
        setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
        alert(L.receivedSuccess);
    };

    const handleReleaseFunds = async (orderId) => {
        try {
            const updated = await ordersApi.releaseFundsToSeller(orderId);
            setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
            alert(L.releaseSuccess);
        } catch {
            alert(L.releaseFailed);
            ordersApi.fetchBuyerOrders(user.id).then(setOrders).catch(() => {});
        }
    };

    const handleSubmitClaim = async (orderId, reason, onDone) => {
        setClaiming(orderId);
        try {
            const updated = await ordersApi.submitBuyerClaim(orderId, reason);
            setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
            alert(L.claimSuccess);
            onDone?.();
        } catch (err) {
            alert(err.message === 'CLAIM_WINDOW_CLOSED' ? L.claimClosed : L.claimFailed);
            // Show the order as it really is now.
            ordersApi.fetchBuyerOrders(user.id).then(setOrders).catch(() => {});
        } finally {
            setClaiming(null);
        }
    };

    const handleOpenItem = (itemId) => {
        const exists = items.some(i => i.id === itemId);
        if (exists) navigate(`/item/${itemId}`);
    };

    const handleMessageSeller = async (order) => {
        const thread = await getOrCreateThread({
            itemId: order.itemId,
            itemTitle: order.itemTitle,
            sellerId: order.sellerId,
            buyerId: user.id,
        });
        onSelectThread(thread.id);
        window.dispatchEvent(new CustomEvent('subasti:open-chat', { detail: { threadId: thread.id } }));
        document.getElementById('buyer-messages')?.scrollIntoView({ behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="seller-dashboard seller-dashboard--loading">
                <p className="text-gray-500 text-sm">{loc === 'en' ? 'Loading purchases…' : 'Cargando compras…'}</p>
            </div>
        );
    }

    const noticeParts = [];
    if (pendingPayment.length) noticeParts.push(`${pendingPayment.length} ${L.payNotice}`);
    if (awaitingConfirmation.length) noticeParts.push(`${awaitingConfirmation.length} ${L.escrowNotice}`);
    if (inTransit.length) noticeParts.push(`${inTransit.length} ${L.shipNotice}`);
    if (outbidCount) noticeParts.push(`${outbidCount} ${L.outbidNotice}`);

    const renderOrderList = (list, emptyMsg) => (
        list.length === 0
            ? <p className="text-sm text-gray-500">{emptyMsg}</p>
            : (
                <div className="seller-orders-list">
                    {list.map(order => (
                        <BuyerOrderCard
                            key={order.id}
                            order={order}
                            loc={loc}
                            users={users}
                            L={L}
                            onPay={handlePay}
                            onConfirmReceived={handleConfirmReceived}
                            onReleaseFunds={handleReleaseFunds}
                            onSubmitClaim={handleSubmitClaim}
                            onOpenItem={handleOpenItem}
                            onMessageSeller={handleMessageSeller}
                            claiming={claiming}
                            canReview={!!reviewedIds && ['completed', 'refunded'].includes(order.status) && !reviewedIds.includes(order.id)}
                            reviewed={!!reviewedIds && reviewedIds.includes(order.id)}
                            onReviewed={handleReviewed}
                        />
                    ))}
                </div>
            )
    );

    return (
        <div className="seller-dashboard buyer-dashboard">
            <h3 className="text-xl font-bold text-gray-800 mb-4">{L.dashboard}</h3>

            <div className="seller-section">
                <EscrowPanel loc={loc} compact />
            </div>

            <div className="seller-stats-grid">
                <StatCard
                    label={L.pendingPayment}
                    value={pendingPayment.length}
                    sub={pendingPayment.length ? L.payNotice.split(' ').slice(1).join(' ') : L.noPendingPayments}
                    accent={pendingPayment.length ? 'amber' : undefined}
                />
                <StatCard
                    label={L.inTransit}
                    value={inTransit.length}
                    sub={inTransit.length ? L.shipNotice : L.noShipping}
                    accent={inTransit.length ? 'info' : undefined}
                />
                <StatCard
                    label={L.escrowSection}
                    value={awaitingConfirmation.length}
                    sub={awaitingConfirmation.length ? L.escrowNotice : L.noEscrow}
                    accent={awaitingConfirmation.length ? 'amber' : undefined}
                />
                <StatCard
                    label={L.activeOrders}
                    value={activeCount}
                    sub={`${escrowWaiting.length} ${loc === 'en' ? 'in escrow' : 'en depósito'}`}
                />
            </div>

            <div className={`seller-notice ${hasUrgent ? 'seller-notice--warn' : 'seller-notice--ok'}`}>
                <strong>{L.notices}:</strong>{' '}
                {hasUrgent ? noticeParts.join(' ') : L.noNotices}
            </div>

            <BuyerOffersSection
                loc={loc}
                onAccepted={() => {
                    ordersApi.fetchBuyerOrders(user.id).then(setOrders).catch(() => {});
                    fetchMyBids().then(setBids).catch(() => {});
                }}
            />

            <div className="seller-section" id="buyer-bids">
                <h4>{L.myBids}</h4>
                {bidRows.length === 0 && <p className="text-sm text-gray-500">{L.noBids}</p>}
                {activeBids.length > 0 && (
                    <>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{L.activeBidsHeading}</p>
                        <div className="seller-orders-list">
                            {activeBids.map(r => (
                                <BidRow key={r.entry.item.id} entry={r.entry} status={r.status} loc={loc} L={L} onOpenItem={handleOpenItem} />
                            ))}
                        </div>
                    </>
                )}
                {endedBids.length > 0 && (
                    <>
                        <p className="text-xs font-semibold text-gray-500 uppercase mt-4 mb-2">{L.endedBidsHeading}</p>
                        <div className="seller-orders-list">
                            {endedBids.map(r => (
                                <BidRow key={r.entry.item.id} entry={r.entry} status={r.status} loc={loc} L={L} onOpenItem={handleOpenItem} />
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="seller-section">
                <h4>{L.pendingPayments}</h4>
                {renderOrderList(pendingPayment, L.noPendingPayments)}
            </div>

            {escrowWaiting.length > 0 && (
                <div className="seller-section">
                    <h4>{L.awaitingShipment}</h4>
                    {renderOrderList(escrowWaiting, '')}
                </div>
            )}

            <div className="seller-section">
                <h4>{L.escrowSection}</h4>
                {renderOrderList(awaitingConfirmation, L.noEscrow)}
            </div>

            {claimPending.length > 0 && (
                <div className="seller-section">
                    <h4>{loc === 'en' ? 'Claims under review' : 'Reclamos en revisión'}</h4>
                    {renderOrderList(claimPending, '')}
                </div>
            )}

            <div className="seller-section">
                <h4>{L.shipping}</h4>
                {renderOrderList(inTransit, L.noShipping)}
            </div>

            <div className="seller-section">
                <h4>{L.history}</h4>
                {renderOrderList(completed, L.noHistory)}
            </div>

            <div className="seller-section" id="buyer-messages">
                <h4>{L.sellerMessages}</h4>
                <ChatPanel
                    loc={loc}
                    user={user}
                    users={users}
                    threads={buyerThreads}
                    role="buyer"
                    collapsible
                    initialOpenThreadId={chatOpenThreadId}
                    activeThreadId={activeThreadId}
                    onSelectThread={onSelectThread}
                    userEmail={user.email}
                />
            </div>

            <div className="seller-section">
                <h4>{L.favs}</h4>
                <ProfilePageItemList
                    list={myFavorites}
                    emptyMsg={L.noFavs}
                    onOpen={handleOpenItem}
                    onToggleFav={toggleFav}
                    isFav={isFav}
                    loc={loc}
                    L={L}
                />
            </div>

            {payingOrder && (
                <PayOrderModal
                    order={payingOrder}
                    loc={loc}
                    methods={acceptedMethods(items.find(i => i.id === payingOrder.itemId))}
                    onClose={() => setPayingOrder(null)}
                    onPaid={handlePaid}
                    onReported={handleSinpeReported}
                />
            )}
        </div>
    );
};

export default BuyerDashboard;
