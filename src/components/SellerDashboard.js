import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    PLACEHOLDER_IMG,
    formatMoney,
    formatMoneyTotals,
    itemCurrency,
    calculateAverageRating,
    CountdownTimer,
} from './Shared';
import { saleTypeBadge } from '../data/i18n';
import * as sellerApi from '../api/seller';
import { useMessages } from '../context/MessagesContext';
import ChatPanel from './ChatPanel';
import { sellerStatusLabel, orderStatusClass, canSellerShip, canSellerCancel } from '../data/escrow';
import EscrowPanel from './EscrowPanel';

const sumByCurrency = (entries, getAmount) =>
    entries.reduce((acc, entry) => {
        const currency = entry.currency || 'CRC';
        acc[currency] = (acc[currency] || 0) + getAmount(entry);
        return acc;
    }, {});

const listingStatus = (item, loc) => {
    if (item.saleType === 'auc') {
        if (item.endAt > Date.now()) {
            return { label: loc === 'en' ? 'Live auction' : 'Subasta activa', cls: 'seller-badge seller-badge--info' };
        }
        return { label: loc === 'en' ? 'Auction ended' : 'Subasta finalizada', cls: 'seller-badge seller-badge--warn' };
    }
    return { label: loc === 'en' ? 'Active listing' : 'Publicación activa', cls: 'seller-badge seller-badge--ok' };
};

const StatCard = ({ label, value, sub, accent }) => (
    <div className={`seller-stat-card ${accent ? `seller-stat-card--${accent}` : ''}`}>
        <p className="seller-stat-label">{label}</p>
        <p className="seller-stat-value">{value}</p>
        {sub && <p className="seller-stat-sub">{sub}</p>}
    </div>
);

const SellerDashboard = ({ user, users, items, loc }) => {
    const navigate = useNavigate();
    const { sellerThreads } = useMessages();
    const [orders, setOrders] = useState([]);
    const [activeThreadId, setActiveThreadId] = useState(null);
    const [trackingDraft, setTrackingDraft] = useState({});
    const [timeframeDraft, setTimeframeDraft] = useState({});
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(null);

    const L = loc === 'en' ? {
        dashboard: 'Seller Dashboard',
        totalEarned: 'Total earned',
        pendingPayout: 'Pending payout',
        activeListings: 'Active listings',
        toShip: 'To ship',
        unreadMessages: 'Unread messages',
        avgRating: 'Avg. rating',
        reviews: 'reviews',
        notices: 'Action needed',
        shipNotice: 'orders need your attention — ship or confirm pickup.',
        noNotices: 'You are all caught up. No urgent actions.',
        myListings: 'Current listings',
        views: 'Bids',
        price: 'Price',
        status: 'Status',
        type: 'Type',
        noListings: 'You have no active listings. List an item to start selling.',
        listItem: 'List an item',
        sales: 'Recent sales',
        buyer: 'Buyer',
        amount: 'Amount',
        sold: 'Sold',
        noSales: 'No sales yet.',
        markShipped: 'Mark shipped',
        markPickup: 'Mark picked up',
        tracking: 'Tracking #',
        optional: 'optional',
        messages: 'Buyer messages',
        anonymous: 'Buyer',
        fulfillmentShip: 'Shipping',
        fulfillmentPickup: 'Local pickup',
        shipBy: 'Ship by',
        endedAuction: 'Ended — contact high bidder',
        allTime: 'All time',
        thisMonth: 'This month',
        liveAuctions: 'live auctions',
        buyNow: 'buy now',
        escrowHeld: 'Funds secured in Subasti escrow — ship within 48h',
        awaitingPayment: 'Do not ship until buyer payment is secured',
        cancelOrder: 'Cancel & relist',
        cancelSuccess: 'Order cancelled. You may repost the item.',
        shipTimeframe: 'Delivery timeframe',
        shipTimeframePh: 'e.g. 3-5 business days',
        timeframeRequired: 'Enter the expected delivery timeframe before shipping.',
        paymentDue: 'Payment due by',
    } : {
        dashboard: 'Panel de Vendedor',
        totalEarned: 'Total ganado',
        pendingPayout: 'Pago pendiente',
        activeListings: 'Publicaciones activas',
        toShip: 'Por enviar',
        unreadMessages: 'Mensajes sin leer',
        avgRating: 'Calificación prom.',
        reviews: 'reseñas',
        notices: 'Acción requerida',
        shipNotice: 'pedidos requieren tu atención — envía o confirma recogida.',
        noNotices: 'Todo al día. No hay acciones urgentes.',
        myListings: 'Publicaciones actuales',
        views: 'Ofertas',
        price: 'Precio',
        status: 'Estado',
        type: 'Tipo',
        noListings: 'No tienes publicaciones activas. Publica un artículo para empezar a vender.',
        listItem: 'Publicar artículo',
        sales: 'Ventas recientes',
        buyer: 'Comprador',
        amount: 'Monto',
        sold: 'Vendido',
        noSales: 'Aún no hay ventas.',
        markShipped: 'Marcar enviado',
        markPickup: 'Marcar recogido',
        tracking: 'Número de rastreo',
        optional: 'opcional',
        messages: 'Mensajes de compradores',
        anonymous: 'Comprador',
        fulfillmentShip: 'Envío',
        fulfillmentPickup: 'Recogida local',
        shipBy: 'Enviar antes de',
        endedAuction: 'Finalizada — contacta al mejor postor',
        allTime: 'Histórico',
        thisMonth: 'Este mes',
        liveAuctions: 'subastas activas',
        buyNow: 'compra directa',
        escrowHeld: 'Fondos asegurados en depósito Subasti — envíe en 48h',
        awaitingPayment: 'No envíe hasta que el pago del comprador esté asegurado',
        cancelOrder: 'Cancelar y republicar',
        cancelSuccess: 'Pedido cancelado. Puede volver a publicar el artículo.',
        shipTimeframe: 'Plazo de entrega',
        shipTimeframePh: 'ej. 3-5 días hábiles',
        timeframeRequired: 'Indique el plazo estimado de entrega antes de enviar.',
        paymentDue: 'Pago antes de',
    };

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            const orderData = await sellerApi.fetchSellerOrders(user.id);
            if (!cancelled) {
                setOrders(orderData);
                setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [user.id]);

    useEffect(() => {
        if (sellerThreads.length && !activeThreadId) {
            setActiveThreadId(sellerThreads[0].id);
        }
    }, [sellerThreads, activeThreadId]);

    const myListings = useMemo(() => items.filter(i => i.sellerId === user.id), [items, user.id]);

    const activeListings = useMemo(
        () => myListings.filter(i => i.saleType !== 'auc' || i.endAt > Date.now()),
        [myListings]
    );

    const liveAuctions = activeListings.filter(i => i.saleType === 'auc').length;
    const buyNowCount = activeListings.filter(i => i.saleType === 'buy').length;

    const completedOrders = orders.filter(o => o.status === 'completed');
    const pendingShip = orders.filter(o => o.status === 'escrow_held');
    const awaitingPayment = orders.filter(o => o.status === 'pending_payment');
    const pendingPayout = orders.filter(o =>
        ['escrow_held', 'shipped', 'awaiting_confirmation', 'claim_pending'].includes(o.status)
    );

    const earnedAllTime = sumByCurrency(completedOrders, o => o.amount + (o.shippingCost || 0));
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const earnedThisMonth = sumByCurrency(
        completedOrders.filter(o => o.soldAt >= monthStart.getTime()),
        o => o.amount + (o.shippingCost || 0)
    );
    const pendingTotals = sumByCurrency(pendingPayout, o => o.amount);

    const unreadTotal = sellerThreads.reduce((n, t) => n + (t.unreadForSeller || 0), 0);
    const avgRating = calculateAverageRating(user.reviews || []);
    const reviewCount = user.reviews?.length || 0;

    const buyerName = (buyerId) => {
        if (buyerId.startsWith('guest')) return L.anonymous;
        return users[buyerId]?.profileName || L.anonymous;
    };

    const formatDate = (ts) => {
        if (!ts) return '—';
        return new Date(ts).toLocaleDateString(loc === 'en' ? 'en-US' : 'es-CR', {
            month: 'short', day: 'numeric', year: 'numeric',
        });
    };

    const handleMarkShipped = async (order) => {
        const timeframe = (timeframeDraft[order.id] || '').trim();
        if (!timeframe) {
            alert(L.timeframeRequired);
            return;
        }
        setActing(order.id);
        try {
            const tracking = trackingDraft[order.id] || '';
            const updated = order.fulfillment === 'pickup'
                ? await sellerApi.markOrderReadyForPickup(order.id, { shippingTimeframe: timeframe })
                : await sellerApi.markOrderShipped(order.id, { trackingNumber: tracking, shippingTimeframe: timeframe });
            setOrders(prev => prev.map(o => (o.id === order.id ? updated : o)));
        } catch {
            // ignore
        } finally {
            setActing(null);
        }
    };

    const handleCancelOrder = async (orderId) => {
        setActing(orderId);
        try {
            const updated = await sellerApi.sellerCancelOrder(orderId);
            setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
            alert(L.cancelSuccess);
        } catch {
            // ignore
        } finally {
            setActing(null);
        }
    };

    if (loading) {
        return (
            <div className="seller-dashboard seller-dashboard--loading">
                <p className="text-gray-500 text-sm">{loc === 'en' ? 'Loading seller data…' : 'Cargando datos del vendedor…'}</p>
            </div>
        );
    }

    return (
        <div className="seller-dashboard">
            <h3 className="text-xl font-bold text-gray-800 mb-4">{L.dashboard}</h3>

            <div className="seller-section">
                <EscrowPanel loc={loc} compact />
            </div>

            <div className="seller-stats-grid">
                <StatCard
                    label={L.totalEarned}
                    value={formatMoneyTotals(earnedAllTime, loc) || '—'}
                    sub={`${L.thisMonth}: ${formatMoneyTotals(earnedThisMonth, loc) || '—'}`}
                    accent="purple"
                />
                <StatCard
                    label={L.pendingPayout}
                    value={formatMoneyTotals(pendingTotals, loc) || '—'}
                    sub={`${pendingPayout.length} ${loc === 'en' ? 'open orders' : 'pedidos abiertos'}`}
                    accent="amber"
                />
                <StatCard
                    label={L.activeListings}
                    value={activeListings.length}
                    sub={`${liveAuctions} ${L.liveAuctions}, ${buyNowCount} ${L.buyNow}`}
                />
                <StatCard
                    label={L.toShip}
                    value={pendingShip.length}
                    sub={pendingShip.length ? L.shipNotice.split('—')[0].trim() : L.noNotices}
                    accent={pendingShip.length ? 'red' : undefined}
                />
                <StatCard
                    label={L.unreadMessages}
                    value={unreadTotal}
                    sub={`${sellerThreads.length} ${loc === 'en' ? 'conversations' : 'conversaciones'}`}
                />
                <StatCard
                    label={L.avgRating}
                    value={reviewCount ? avgRating.toFixed(1) : '—'}
                    sub={reviewCount ? `${reviewCount} ${L.reviews}` : (loc === 'en' ? 'No reviews yet' : 'Sin reseñas aún')}
                />
            </div>

            <div className={`seller-notice ${pendingShip.length || awaitingPayment.length ? 'seller-notice--warn' : 'seller-notice--ok'}`}>
                <strong>{L.notices}:</strong>{' '}
                {pendingShip.length
                    ? `${pendingShip.length} ${L.shipNotice}`
                    : awaitingPayment.length
                        ? `${awaitingPayment.length} ${loc === 'en' ? 'awaiting buyer payment (do not ship yet).' : 'esperando pago del comprador (no envíe aún).'}` 
                        : L.noNotices}
            </div>

            <div className="seller-section">
                <div className="seller-section-header">
                    <h4>{L.myListings}</h4>
                    <button type="button" onClick={() => navigate('/sell')} className="seller-link-btn">{L.listItem}</button>
                </div>
                {myListings.length === 0 ? (
                    <p className="text-sm text-gray-500">{L.noListings}</p>
                ) : (
                    <div className="seller-table-wrap">
                        <table className="seller-table">
                            <thead>
                                <tr>
                                    <th>{loc === 'en' ? 'Item' : 'Artículo'}</th>
                                    <th>{L.type}</th>
                                    <th>{L.price}</th>
                                    <th>{L.views}</th>
                                    <th>{L.status}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myListings.map(item => {
                                    const st = listingStatus(item, loc);
                                    const currency = itemCurrency(item);
                                    const displayPrice = item.saleType === 'auc'
                                        ? (item.currentBid ?? item.price)
                                        : item.price;
                                    return (
                                        <tr key={item.id}>
                                            <td>
                                                <button type="button" className="seller-item-row" onClick={() => navigate(`/item/${item.id}`)}>
                                                    <img src={item.image || PLACEHOLDER_IMG} alt="" />
                                                    <span>{item.title}</span>
                                                </button>
                                            </td>
                                            <td><span className="seller-badge">{saleTypeBadge(item.saleType, loc)}</span></td>
                                            <td className="font-semibold">{formatMoney(displayPrice, loc, currency)}</td>
                                            <td>
                                                {item.saleType === 'auc' ? (
                                                    <div className="seller-auction-meta">
                                                        <span>{item.bids || 0}</span>
                                                        {item.endAt > Date.now() && (
                                                            <CountdownTimer targetDate={item.endAt} loc={loc} />
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span>{item.quantity ?? 1} {loc === 'en' ? 'in stock' : 'disp.'}</span>
                                                )}
                                            </td>
                                            <td><span className={st.cls}>{st.label}</span></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="seller-section">
                <h4>{L.sales}</h4>
                {orders.length === 0 ? (
                    <p className="text-sm text-gray-500">{L.noSales}</p>
                ) : (
                    <div className="seller-orders-list">
                        {orders.map(order => (
                            <div key={order.id} className="seller-order-card">
                                <div className="seller-order-main">
                                    <img src={order.image || PLACEHOLDER_IMG} alt="" />
                                    <div className="seller-order-info">
                                        <p className="font-semibold text-gray-800">{order.itemTitle}</p>
                                        <p className="text-sm text-gray-600">
                                            {L.buyer}: <span className="font-medium">{buyerName(order.buyerId)}</span>
                                            {' · '}{L.sold}: {formatDate(order.soldAt)}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {order.fulfillment === 'ship' ? L.fulfillmentShip : L.fulfillmentPickup}
                                            {order.shipByAt && order.status === 'escrow_held' && (
                                                <> · {L.shipBy} {formatDate(order.shipByAt)}</>
                                            )}
                                            {order.status === 'pending_payment' && order.paymentDueAt && (
                                                <> · {L.paymentDue} {formatDate(order.paymentDueAt)}</>
                                            )}
                                            {order.shippingTimeframe && (
                                                <> · {L.shipTimeframe}: {order.shippingTimeframe}</>
                                            )}
                                        </p>
                                        {order.status === 'escrow_held' && (
                                            <p className="text-xs text-purple-600 font-medium mt-0.5">{L.escrowHeld}</p>
                                        )}
                                        {order.status === 'pending_payment' && (
                                            <p className="text-xs text-amber-700 font-medium mt-0.5">{L.awaitingPayment}</p>
                                        )}
                                        <p className="text-sm font-bold text-purple-700 mt-1">
                                            {formatMoney(order.amount, loc, order.currency)}
                                            {order.shippingCost > 0 && (
                                                <span className="text-gray-500 font-normal">
                                                    {' '}+ {formatMoney(order.shippingCost, loc, order.currency)} {loc === 'en' ? 'shipping' : 'envío'}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="seller-order-actions">
                                    <span className={orderStatusClass(order.status)}>
                                        {sellerStatusLabel(order, loc)}
                                    </span>
                                    {canSellerShip(order) && (
                                        <div className="seller-ship-form">
                                            <input
                                                type="text"
                                                placeholder={L.shipTimeframePh}
                                                value={timeframeDraft[order.id] || ''}
                                                onChange={e => setTimeframeDraft(prev => ({ ...prev, [order.id]: e.target.value }))}
                                                className="seller-input"
                                                required
                                            />
                                            {order.fulfillment === 'ship' && (
                                                <input
                                                    type="text"
                                                    placeholder={`${L.tracking} (${L.optional})`}
                                                    value={trackingDraft[order.id] || ''}
                                                    onChange={e => setTrackingDraft(prev => ({ ...prev, [order.id]: e.target.value }))}
                                                    className="seller-input"
                                                />
                                            )}
                                            <button
                                                type="button"
                                                disabled={acting === order.id}
                                                onClick={() => handleMarkShipped(order)}
                                                className="seller-action-btn"
                                            >
                                                {acting === order.id ? '…' : (order.fulfillment === 'ship' ? L.markShipped : L.markPickup)}
                                            </button>
                                        </div>
                                    )}
                                    {canSellerCancel(order) && (
                                        <button
                                            type="button"
                                            disabled={acting === order.id}
                                            onClick={() => handleCancelOrder(order.id)}
                                            className="buyer-order-link-btn"
                                        >
                                            {L.cancelOrder}
                                        </button>
                                    )}
                                    {order.trackingNumber && (
                                        <p className="text-xs text-gray-500">{L.tracking}: {order.trackingNumber}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="seller-section">
                <h4>{L.messages}</h4>
                <ChatPanel
                    loc={loc}
                    user={user}
                    users={users}
                    threads={sellerThreads}
                    role="seller"
                    activeThreadId={activeThreadId}
                    onSelectThread={setActiveThreadId}
                    userEmail={user.email}
                />
            </div>
        </div>
    );
};

export default SellerDashboard;
