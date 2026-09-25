import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useItems } from '../context/ItemsContext';
import { useMessages } from '../context/MessagesContext';
import { useNotifications } from '../context/NotificationsContext';
import SellerDashboard from '../components/SellerDashboard';
import BuyerDashboard from '../components/BuyerDashboard';
import ChatPanel from '../components/ChatPanel';
import { fetchBuyerOrders, fetchSellerOrders } from '../api/orders';
import { fetchRecentlyViewed } from '../api/account';
import { PLACEHOLDER_IMG, CRC, formatMoneyTotals, StatCard, ProfilePageItemList } from '../components/Shared';
import { buyerStatusLabel, ORDER_STATUS } from '../data/escrow';

const NET_STATUSES = [
    ORDER_STATUS.ESCROW_HELD, ORDER_STATUS.SHIPPED, ORDER_STATUS.AWAITING_CONFIRMATION,
    ORDER_STATUS.CLAIM_PENDING, ORDER_STATUS.COMPLETED,
];

const sumByCurrency = (orders) => orders.reduce((sums, o) => {
    sums[o.currency] = (sums[o.currency] || 0) + o.amount + (o.shippingCost || 0);
    return sums;
}, {});

const isActiveListing = (item) => item.saleType !== 'auc' || !item.endAt || item.endAt > Date.now();

const ProfilePage = ({ loc }) => {
    const { user, users, updateProfile, ensureUserLoaded } = useAuth();
    const { items, favorites, isFav, toggleFav } = useItems();
    const { threads, unreadBuyerCount, unreadSellerCount } = useMessages();
    const { notifications, unreadCount: unreadNotificationCount, markRead: markNotificationRead, markAllRead: markAllNotificationsRead } = useNotifications();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'account');
    const [buyerThreadId, setBuyerThreadId] = useState(searchParams.get('thread') || null);
    const [messagesThreadId, setMessagesThreadId] = useState(searchParams.get('thread') || null);
    const [buyerOrders, setBuyerOrders] = useState([]);
    const [sellerOrders, setSellerOrders] = useState([]);
    const [recentlyViewedIds, setRecentlyViewedIds] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(user || {});
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    const L = loc === 'en' ? {
        title: 'My Profile',
        tabAccount: 'Overview',
        tabBuying: 'Buying',
        tabSelling: 'Selling',
        tabMessages: 'Messages',
        notifications: 'Notifications',
        noNotifications: 'No notifications yet.',
        markAllRead: 'Mark all read',
        conversations: 'Conversations',
        profileName: 'Profile Name',
        accountNumber: 'Account Number',
        realName: 'Full Name',
        email: 'Email',
        phone: 'Phone',
        location: 'Location',
        returnPolicy: 'Return Policy',
        returnPolicyHint: 'Shown to buyers on your listings. Leave blank to show no return policy.',
        edit: 'Edit',
        save: 'Save Changes',
        saving: 'Saving…',
        cancel: 'Cancel',
        memberSince: 'Member since',
        yourActivity: 'Your Activity',
        totalPurchases: 'Total Purchases',
        totalSpent: 'Total Spent',
        auctionsWon: 'Auctions Won',
        watching: 'Watchlist',
        sellingActivity: 'Selling Activity',
        itemsListed: 'Items Listed',
        activeListings: 'Active Listings',
        totalSales: 'Completed Sales',
        totalEarned: 'Total Earned',
        recentPurchases: 'Recent Purchases',
        viewAll: 'View all',
        noPurchasesYet: "You haven't bought anything yet.",
        browse: 'Browse Items',
        recentlyViewed: 'Recently Viewed',
        noRecentlyViewed: "Items you view will show up here.",
        watchlist: 'Watchlist',
        noFavoritesYet: "You haven't favorited any items yet.",
        favAdd: 'Add to favorites',
        favRemove: 'Remove from favorites',
        saveFailed: 'Could not save changes.',
    } : {
        title: 'Mi Perfil',
        tabAccount: 'Resumen',
        tabBuying: 'Compras',
        tabSelling: 'Ventas',
        tabMessages: 'Mensajes',
        notifications: 'Notificaciones',
        noNotifications: 'Aún no hay notificaciones.',
        markAllRead: 'Marcar todas leídas',
        conversations: 'Conversaciones',
        profileName: 'Nombre de Perfil',
        accountNumber: 'Número de Cuenta',
        realName: 'Nombre Completo',
        email: 'Correo',
        phone: 'Teléfono',
        location: 'Ubicación',
        returnPolicy: 'Política de Devoluciones',
        returnPolicyHint: 'Se muestra a los compradores en tus artículos. Déjalo en blanco para no mostrar ninguna política.',
        edit: 'Editar',
        save: 'Guardar Cambios',
        saving: 'Guardando…',
        cancel: 'Cancelar',
        memberSince: 'Miembro desde',
        yourActivity: 'Tu Actividad',
        totalPurchases: 'Compras Totales',
        totalSpent: 'Total Gastado',
        auctionsWon: 'Subastas Ganadas',
        watching: 'Lista de Seguimiento',
        sellingActivity: 'Actividad de Venta',
        itemsListed: 'Artículos Publicados',
        activeListings: 'Publicaciones Activas',
        totalSales: 'Ventas Completadas',
        totalEarned: 'Total Ganado',
        recentPurchases: 'Compras Recientes',
        viewAll: 'Ver todo',
        noPurchasesYet: 'Aún no has comprado nada.',
        browse: 'Ver Artículos',
        recentlyViewed: 'Vistos Recientemente',
        noRecentlyViewed: 'Los artículos que veas aparecerán aquí.',
        watchlist: 'Lista de Seguimiento',
        noFavoritesYet: 'Aún no has agregado ningún artículo a favoritos.',
        favAdd: 'Agregar a favoritos',
        favRemove: 'Quitar de favoritos',
        saveFailed: 'No se pudieron guardar los cambios.',
    };

    useEffect(() => {
        const tab = searchParams.get('tab');
        const thread = searchParams.get('thread');
        if (tab) setActiveTab(tab);
        if (thread) {
            setBuyerThreadId(thread);
            setMessagesThreadId(thread);
        }
    }, [searchParams]);

    // Without this, a user with exactly one conversation sees a blank panel:
    // the thread switcher only appears once there's more than one thread,
    // and nothing auto-selects the lone one otherwise (same fix as
    // BuyerDashboard's own buyerThreads-only chat).
    useEffect(() => {
        if (!messagesThreadId && threads.length > 0) {
            setMessagesThreadId(threads[0].id);
        }
    }, [messagesThreadId, threads]);

    // The Messages tab mixes threads from both sides, so (unlike
    // BuyerDashboard/SellerDashboard, which only ever need the other party
    // on their one fixed side) it can hit a counterparty this session
    // hasn't loaded a profile for yet — same reason ItemViewPage loads the
    // seller before showing "Sold by". Tracked in a ref (not just the
    // `!users[id]` check) because ensureUserLoaded/users both change
    // identity on every load, which otherwise re-fires this effect faster
    // than the in-flight requests resolve and re-requests the same id.
    const requestedProfilesRef = useRef(new Set());
    useEffect(() => {
        if (!user) return;
        const otherPartyIds = new Set(threads.map((t) => (t.sellerId === user.id ? t.buyerId : t.sellerId)));
        for (const id of otherPartyIds) {
            if (id && !users[id] && !requestedProfilesRef.current.has(id)) {
                requestedProfilesRef.current.add(id);
                ensureUserLoaded(id);
            }
        }
    }, [threads, users, user, ensureUserLoaded]);

    useEffect(() => {
        if (!user) return;
        fetchBuyerOrders().then(setBuyerOrders).catch(() => {});
        fetchSellerOrders().then(setSellerOrders).catch(() => {});
        fetchRecentlyViewed().then((rows) => setRecentlyViewedIds(rows.map((r) => r.itemId))).catch(() => {});
    }, [user]);

    // formData's useState(user || {}) initializer only runs once — if `user`
    // is still null on first render (e.g. navigating straight to /profile,
    // before /api/auth/me resolves) the edit form would be stuck with an
    // empty object forever. Keep it in sync whenever `user` loads/changes,
    // but only while not actively editing so we don't clobber unsaved input.
    useEffect(() => {
        if (user && !isEditing) setFormData(user);
    }, [user, isEditing]);

    const buyerAlertCount = useMemo(() => buyerOrders.filter(o =>
        o.status === ORDER_STATUS.PENDING_PAYMENT || o.status === ORDER_STATUS.SHIPPED || o.status === ORDER_STATUS.AWAITING_CONFIRMATION
    ).length, [buyerOrders]);

    const stats = useMemo(() => {
        const netBuyerOrders = buyerOrders.filter(o => NET_STATUSES.includes(o.status));
        const myItems = items.filter(i => i.sellerId === user?.id);
        const completedSales = sellerOrders.filter(o => o.status === ORDER_STATUS.COMPLETED);
        return {
            totalPurchases: buyerOrders.length,
            spentByCurrency: sumByCurrency(netBuyerOrders),
            auctionsWon: buyerOrders.filter(o => o.orderType === 'auction_won').length,
            itemsListed: myItems.length,
            activeListings: myItems.filter(isActiveListing).length,
            totalSales: completedSales.length,
            earnedByCurrency: sumByCurrency(completedSales),
        };
    }, [buyerOrders, sellerOrders, items, user]);

    const recentPurchases = useMemo(() => buyerOrders.slice(0, 5), [buyerOrders]);

    const recentlyViewedItems = useMemo(() =>
        recentlyViewedIds.map((id) => items.find((i) => i.id === id)).filter(Boolean),
        [recentlyViewedIds, items]
    );

    const favoritesPreview = useMemo(() =>
        items.filter((i) => favorites.includes(i.id)).slice(0, 8),
        [items, favorites]
    );

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        const next = new URLSearchParams(searchParams);
        next.set('tab', tabId);
        if (tabId !== 'buying' && tabId !== 'messages') next.delete('thread');
        setSearchParams(next, { replace: true });
    };

    const handleBuyerThreadSelect = (threadId) => {
        setBuyerThreadId(threadId);
        const next = new URLSearchParams(searchParams);
        next.set('tab', 'buying');
        next.set('thread', threadId);
        setSearchParams(next, { replace: true });
    };

    const handleMessagesThreadSelect = (threadId) => {
        setMessagesThreadId(threadId);
        const next = new URLSearchParams(searchParams);
        next.set('tab', 'messages');
        next.set('thread', threadId);
        setSearchParams(next, { replace: true });
    };

    const handleOpenItem = (id) => navigate(`/item/${id}`);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSaveError('');
        try {
            await updateProfile({ profileName: formData.profileName, phone: formData.phone, returnPolicy: formData.returnPolicy });
            setIsEditing(false);
        } catch (err) {
            setSaveError(err.message || L.saveFailed);
        } finally {
            setSaving(false);
        }
    };

    if (!user) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-md border text-center">
                <h2 className="text-2xl font-bold text-gray-800">{loc === 'en' ? 'Please log in' : 'Por favor inicia sesión'}</h2>
                <button onClick={() => navigate('/login')} className="mt-6 bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                    {loc === 'en' ? 'Log In' : 'Iniciar Sesión'}
                </button>
            </div>
        );
    }

    const buyingBadge = unreadBuyerCount + buyerAlertCount;
    const messagesBadge = unreadBuyerCount + unreadSellerCount + unreadNotificationCount;

    const tabs = [
        { id: 'account', label: L.tabAccount },
        { id: 'buying', label: L.tabBuying, badge: buyingBadge },
        { id: 'selling', label: L.tabSelling },
        { id: 'messages', label: L.tabMessages, badge: messagesBadge },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">{L.title}</h2>
                <nav className="profile-tabs" aria-label={loc === 'en' ? 'Profile sections' : 'Secciones del perfil'}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            className={`profile-tab ${activeTab === tab.id ? 'profile-tab--active' : ''}`}
                            onClick={() => handleTabChange(tab.id)}
                        >
                            {tab.label}
                            {tab.badge > 0 && <span className="profile-tab-badge">{tab.badge}</span>}
                        </button>
                    ))}
                </nav>
            </div>

            {activeTab === 'account' && (
                <div className="space-y-6">
                    {/* Profile header + editable info */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800">{user.profileName}</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {L.accountNumber}: {user.accountNumber}
                                    {user.createdAt && ` · ${L.memberSince} ${new Date(user.createdAt).toLocaleDateString(loc === 'en' ? 'en-US' : 'es-CR', { year: 'numeric', month: 'long' })}`}
                                </p>
                            </div>
                            {!isEditing && (
                                <button type="button" onClick={() => setIsEditing(true)} className="text-sm font-semibold text-purple-600 hover:underline whitespace-nowrap">{L.edit}</button>
                            )}
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-gray-700 block mb-1">{L.profileName}</label>
                                    <input type="text" name="profileName" value={formData.profileName} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500" />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-700 block mb-1">{L.realName}</label>
                                    <input type="text" name="realName" value={formData.realName} disabled className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-700 block mb-1">{L.email}</label>
                                    <input type="email" name="email" value={formData.email} disabled className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-700 block mb-1">{L.phone}</label>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500" />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-700 block mb-1">{L.location}</label>
                                    <input type="text" name="location" value={`${formData.city}, ${formData.province}`} disabled className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-700 block mb-1">{L.returnPolicy}</label>
                                    <textarea name="returnPolicy" value={formData.returnPolicy || ''} onChange={handleChange} rows={3} maxLength={1000} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500" />
                                    <p className="text-xs text-gray-500 mt-1">{L.returnPolicyHint}</p>
                                </div>
                                {saveError && <p className="text-sm text-red-500">{saveError}</p>}
                                <div className="flex items-center gap-4 pt-2">
                                    <button type="submit" disabled={saving} className="bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60">{saving ? L.saving : L.save}</button>
                                    <button type="button" onClick={() => { setIsEditing(false); setFormData(user); setSaveError(''); }} className="text-sm font-semibold text-gray-600 hover:underline">{L.cancel}</button>
                                </div>
                            </form>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                                <p><span className="font-semibold text-gray-800">{L.realName}:</span> {user.realName}</p>
                                <p><span className="font-semibold text-gray-800">{L.email}:</span> {user.email}</p>
                                <p><span className="font-semibold text-gray-800">{L.phone}:</span> {user.countryCode} {user.phone}</p>
                                <p><span className="font-semibold text-gray-800">{L.location}:</span> {`${user.city}, ${user.province}`}</p>
                            </div>
                        )}
                    </div>

                    {/* Buying stats */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">{L.yourActivity}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard label={L.totalPurchases} value={stats.totalPurchases} />
                            <StatCard label={L.totalSpent} value={formatMoneyTotals(stats.spentByCurrency, loc) || '—'} />
                            <StatCard label={L.auctionsWon} value={stats.auctionsWon} />
                            <StatCard label={L.watching} value={favorites.length} />
                        </div>
                    </div>

                    {/* Selling stats — only if they've ever listed something */}
                    {stats.itemsListed > 0 && (
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">{L.sellingActivity}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatCard label={L.itemsListed} value={stats.itemsListed} />
                                <StatCard label={L.activeListings} value={stats.activeListings} />
                                <StatCard label={L.totalSales} value={stats.totalSales} />
                                <StatCard label={L.totalEarned} value={formatMoneyTotals(stats.earnedByCurrency, loc) || '—'} />
                            </div>
                        </div>
                    )}

                    {/* Recent purchases */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">{L.recentPurchases}</h3>
                            {buyerOrders.length > 0 && (
                                <button type="button" onClick={() => handleTabChange('buying')} className="text-sm font-semibold text-purple-600 hover:underline">{L.viewAll}</button>
                            )}
                        </div>
                        {recentPurchases.length === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-sm text-gray-500 mb-3">{L.noPurchasesYet}</p>
                                <button onClick={() => navigate('/')} className="bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm">{L.browse}</button>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {recentPurchases.map(o => (
                                    <button
                                        key={o.id}
                                        type="button"
                                        onClick={() => handleTabChange('buying')}
                                        className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <img src={o.image || PLACEHOLDER_IMG} alt="" className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm text-gray-800 truncate">{o.itemTitle}</p>
                                                <p className="text-xs text-gray-500">{buyerStatusLabel(o, loc)} · {new Date(o.purchasedAt).toLocaleDateString(loc === 'en' ? 'en-US' : 'es-CR')}</p>
                                            </div>
                                        </div>
                                        <p className="font-semibold text-sm text-gray-800 whitespace-nowrap ml-3">{CRC(o.amount + (o.shippingCost || 0), loc, o.currency)}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recently viewed */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">{L.recentlyViewed}</h3>
                        <ProfilePageItemList list={recentlyViewedItems} emptyMsg={L.noRecentlyViewed} onOpen={handleOpenItem} loc={loc} L={L} />
                    </div>

                    {/* Watchlist preview */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">{L.watchlist}</h3>
                            {favorites.length > 0 && (
                                <button type="button" onClick={() => navigate('/favorites')} className="text-sm font-semibold text-purple-600 hover:underline">{L.viewAll}</button>
                            )}
                        </div>
                        <ProfilePageItemList list={favoritesPreview} emptyMsg={L.noFavoritesYet} onOpen={handleOpenItem} onToggleFav={toggleFav} isFav={isFav} loc={loc} L={L} />
                    </div>
                </div>
            )}

            {activeTab === 'buying' && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <BuyerDashboard
                        user={user}
                        users={users}
                        items={items}
                        loc={loc}
                        favorites={favorites}
                        toggleFav={toggleFav}
                        isFav={isFav}
                        activeThreadId={buyerThreadId}
                        onSelectThread={handleBuyerThreadSelect}
                    />
                </div>
            )}

            {activeTab === 'selling' && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <SellerDashboard user={user} users={users} items={items} loc={loc} />
                </div>
            )}

            {activeTab === 'messages' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800">{L.notifications}</h3>
                            {unreadNotificationCount > 0 && (
                                <button type="button" onClick={markAllNotificationsRead} className="text-sm font-semibold text-purple-600 hover:underline">{L.markAllRead}</button>
                            )}
                        </div>
                        {notifications.length === 0 ? (
                            <p className="text-sm text-gray-500">{L.noNotifications}</p>
                        ) : (
                            <ul className="divide-y divide-gray-100 -mx-2">
                                {notifications.map((notif) => (
                                    <li key={notif.id}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!notif.read) markNotificationRead(notif.id);
                                                if (notif.link) navigate(notif.link);
                                            }}
                                            className={`w-full text-left flex items-start gap-2 px-2 py-3 rounded-lg hover:bg-gray-50 transition-colors ${notif.read ? '' : 'bg-purple-50'}`}
                                        >
                                            {!notif.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-purple-600 flex-shrink-0" />}
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
                                                {notif.body && <p className="text-sm text-gray-500 mt-0.5">{notif.body}</p>}
                                                <p className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleString(loc === 'en' ? 'en-US' : 'es-CR')}</p>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">{L.conversations}</h3>
                        <ChatPanel
                            loc={loc}
                            user={user}
                            users={users}
                            threads={threads}
                            role="mixed"
                            activeThreadId={messagesThreadId}
                            onSelectThread={handleMessagesThreadSelect}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
