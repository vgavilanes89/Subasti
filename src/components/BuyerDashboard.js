import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLACEHOLDER_IMG, formatMoney } from './Shared';
import { useMessages } from '../context/MessagesContext';
import ChatPanel from './ChatPanel';
import * as ordersApi from '../api/orders';
import { buyerStatusLabel, orderStatusClass } from '../data/escrow';
import EscrowPanel from './EscrowPanel';

const StatCard = ({ label, value, sub, accent }) => (
    <div className={`seller-stat-card ${accent ? `seller-stat-card--${accent}` : ''}`}>
        <p className="seller-stat-label">{label}</p>
        <p className="seller-stat-value">{value}</p>
        {sub && <p className="seller-stat-sub">{sub}</p>}
    </div>
);

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
    paying,
    claiming,
}) => {
    const [claimDraft, setClaimDraft] = useState('');
    const [showClaimForm, setShowClaimForm] = useState(false);
    const seller = users[order.sellerId];
    const total = order.amount + (order.shippingCost || 0);

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
                            <> · {L.claimBy} {formatDate(order.confirmationDueAt)}</>
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
                        disabled={paying === order.id}
                        className="seller-action-btn"
                    >
                        {paying === order.id ? '…' : L.payNow}
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
                        <button
                            type="button"
                            onClick={() => setShowClaimForm(s => !s)}
                            className="buyer-order-link-btn"
                        >
                            {L.fileClaim}
                        </button>
                        {showClaimForm && (
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

const ProfilePageItemList = ({ list, emptyMsg, onOpen, onToggleFav, isFav, loc, L }) => (
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
}) => {
    const navigate = useNavigate();
    const { buyerThreads, getOrCreateThread } = useMessages();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(null);
    const [claiming, setClaiming] = useState(null);

    const L = loc === 'en' ? {
        dashboard: 'Buying Dashboard',
        pendingPayment: 'Awaiting payment',
        inTransit: 'In transit',
        activeOrders: 'Active orders',
        pickupScheduled: 'Pickups scheduled',
        notices: 'Action needed',
        payNotice: 'order(s) require payment to complete your purchase.',
        shipNotice: 'item(s) are on the way to you.',
        pickupNotice: 'pickup(s) ready to schedule with the seller.',
        noNotices: 'No urgent buyer actions right now.',
        pendingPayments: 'Payment required',
        noPendingPayments: 'No outstanding payments.',
        shipping: 'Shipping to you',
        noShipping: 'Nothing in transit.',
        pickups: 'Scheduled pickups',
        noPickups: 'No pickups scheduled.',
        history: 'Purchase history',
        noHistory: 'No completed purchases yet.',
        seller: 'Seller',
        purchased: 'Purchased',
        payNow: 'Pay now',
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
        shipNotice: 'artículo(s) están en camino.',
        pickupNotice: 'recogida(s) listas para coordinar con el vendedor.',
        noNotices: 'No hay acciones urgentes por ahora.',
        pendingPayments: 'Pago requerido',
        noPendingPayments: 'No hay pagos pendientes.',
        shipping: 'Envíos hacia ti',
        noShipping: 'Nada en tránsito.',
        pickups: 'Recogidas programadas',
        noPickups: 'No hay recogidas programadas.',
        history: 'Historial de compras',
        noHistory: 'Aún no hay compras completadas.',
        seller: 'Vendedor',
        purchased: 'Comprado',
        payNow: 'Pagar ahora',
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
            const data = await ordersApi.fetchBuyerOrders(user.id);
            if (!cancelled) {
                setOrders(data);
                setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [user.id]);

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

    const myFavorites = items.filter(i => favorites.includes(i.id));

    const hasUrgent = pendingPayment.length > 0 || awaitingConfirmation.length > 0 || inTransit.length > 0;

    const handlePay = async (orderId) => {
        setPaying(orderId);
        try {
            const updated = await ordersApi.payBuyerOrder(orderId);
            setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
            alert(L.paySuccess);
        } catch {
            // ignore
        } finally {
            setPaying(null);
        }
    };

    const handleConfirmReceived = async (orderId) => {
        const updated = await ordersApi.confirmOrderReceived(orderId);
        setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
        alert(L.receivedSuccess);
    };

    const handleReleaseFunds = async (orderId) => {
        const updated = await ordersApi.releaseFundsToSeller(orderId);
        setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
        alert(L.releaseSuccess);
    };

    const handleSubmitClaim = async (orderId, reason, onDone) => {
        setClaiming(orderId);
        try {
            const updated = await ordersApi.submitBuyerClaim(orderId, reason);
            setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
            alert(L.claimSuccess);
            onDone?.();
        } catch {
            // ignore
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
                            paying={paying}
                            claiming={claiming}
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

            <div className="seller-section">
                <h4>{L.pendingPayments}</h4>
                {renderOrderList(pendingPayment, L.noPendingPayments)}
            </div>

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
        </div>
    );
};

export default BuyerDashboard;
