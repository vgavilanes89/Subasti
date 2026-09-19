import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CRC, itemCurrency, formatMoneyTotals } from '../components/Shared';
import { useAuth } from '../context/AuthContext';
import { useItems } from '../context/ItemsContext';
import { useMessages } from '../context/MessagesContext';
import { buyerStatusLabel } from '../data/escrow';
import { normalizeSearch } from '../lib/search';
import ChatPanel from '../components/ChatPanel';
import AdminUserDetailModal from '../components/AdminUserDetailModal';
import AdminItemEditModal from '../components/AdminItemEditModal';

const money = (amount, currency, loc) => CRC(amount, loc, currency);

const PayoutModal = ({ balance, loc, onClose, onSubmit, L }) => {
    const [amount, setAmount] = useState(String(balance.outstanding));
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const parsed = Number(amount);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            setError(L.invalidAmount);
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            await onSubmit({ sellerId: balance.sellerId, currency: balance.currency, amount: parsed, note });
            onClose();
        } catch {
            setError(L.actionFailed);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4">{L.payOut} — {balance.sellerName}</h3>
                <p className="text-sm text-gray-500 mb-4">{L.outstanding}: {money(balance.outstanding, balance.currency, loc)}</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-1">{L.amount}</label>
                        <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2 border rounded-lg" required />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-1">{L.note}</label>
                        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="w-full p-2 border rounded-lg" placeholder={L.notePlaceholder} />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="text-sm font-semibold text-gray-600 hover:underline">{L.cancel}</button>
                        <button type="submit" disabled={submitting} className="bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-60">
                            {submitting ? L.saving : L.confirmPayout}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AdminPage = ({ loc }) => {
    const navigate = useNavigate();
    const { user, users: usersMap } = useAuth();
    const { items, removeItem, replaceItem } = useItems();
    const { threads, getOrCreateAdminThread } = useMessages();

    const [tab, setTab] = useState('overview');
    const [allUsers, setAllUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(true);
    const [payoutsData, setPayoutsData] = useState({ balances: [], history: [] });
    const [loadingPayouts, setLoadingPayouts] = useState(true);
    const [actionError, setActionError] = useState('');
    const [messagingThreadId, setMessagingThreadId] = useState(null);
    const [payoutTarget, setPayoutTarget] = useState(null);
    const [resolvingClaim, setResolvingClaim] = useState(null);
    const [userQuery, setUserQuery] = useState('');
    const [userStatusFilter, setUserStatusFilter] = useState('all');
    const [userSort, setUserSort] = useState('newest');
    const [viewingUserId, setViewingUserId] = useState(null);
    const [editingItem, setEditingItem] = useState(null);

    const L = loc === 'en' ? {
        title: 'Admin Dashboard',
        tabOverview: 'Overview',
        tabUsers: 'Users',
        tabItems: 'Items',
        tabOrders: 'Orders & Logistics',
        tabAnalytics: 'Analytics',
        tabPayouts: 'Payouts',
        userManagement: 'User Management',
        itemManagement: 'Item Management',
        accountNumber: 'Account #',
        profileName: 'Profile Name',
        email: 'Email',
        actions: 'Actions',
        suspend: 'Suspend',
        unsuspend: 'Unsuspend',
        suspended: 'Suspended',
        message: 'Message',
        itemId: 'Item ID',
        itemTitle: 'Title',
        seller: 'Seller',
        price: 'Price',
        remove: 'Remove',
        editItem: 'Edit',
        platformStats: 'Platform Statistics',
        totalUsers: 'Total Users',
        totalItems: 'Total Items',
        activeAuctions: 'Active Auctions',
        totalValue: 'Total Listing Value',
        messages: 'Messages',
        loginRequired: 'Please log in',
        loginButton: 'Log In',
        notAuthorized: 'You are not authorized to view this page.',
        goHome: 'Go Home',
        actionFailed: 'That action failed. Please try again.',
        orderId: 'Order',
        buyer: 'Buyer',
        status: 'Status',
        amount: 'Amount',
        fulfillment: 'Fulfillment',
        tracking: 'Tracking',
        purchased: 'Purchased',
        noOrders: 'No orders yet.',
        approveRefund: 'Approve refund',
        denyReleaseFunds: 'Deny — release funds',
        resolving: 'Resolving…',
        revenueSummary: 'Net Revenue (captured, not refunded)',
        refundedSummary: 'Refunded',
        ordersByStatus: 'Orders by Status',
        topItems: 'Top Items by Revenue',
        topSellers: 'Top Sellers by Revenue',
        topBuyers: 'Top Buyers by Spend',
        orders30d: 'Orders in the Last 30 Days',
        revenue: 'Revenue',
        orderCount: 'Orders',
        outstandingBalances: 'Outstanding Seller Balances',
        payoutHistory: 'Payout History',
        payOut: 'Pay out',
        outstanding: 'Outstanding',
        note: 'Note (optional)',
        notePlaceholder: 'e.g. Bank transfer ref #1234',
        cancel: 'Cancel',
        saving: 'Saving…',
        confirmPayout: 'Record Payout',
        invalidAmount: 'Enter a valid amount.',
        noBalances: 'No outstanding balances.',
        noPayouts: 'No payouts recorded yet.',
        paidBy: 'Recorded by',
        loading: 'Loading…',
        phone: 'Phone',
        location: 'Location',
        searchUsers: 'Search by name, email, account #, or phone…',
        allStatuses: 'All statuses',
        activeOnly: 'Active only',
        suspendedOnly: 'Suspended only',
        sortNewest: 'Newest first',
        sortOldest: 'Oldest first',
        sortNameAsc: 'Name: A→Z',
        sortNameDesc: 'Name: Z→A',
        sortEmailAsc: 'Email: A→Z',
        noUsersMatch: 'No users match your search or filters.',
        viewProfile: 'View Profile',
    } : {
        title: 'Panel de Administración',
        tabOverview: 'Resumen',
        tabUsers: 'Usuarios',
        tabItems: 'Artículos',
        tabOrders: 'Pedidos y Logística',
        tabAnalytics: 'Analítica',
        tabPayouts: 'Pagos a Vendedores',
        userManagement: 'Gestión de Usuarios',
        itemManagement: 'Gestión de Artículos',
        accountNumber: 'N° de Cuenta',
        profileName: 'Nombre de Perfil',
        email: 'Correo',
        actions: 'Acciones',
        suspend: 'Suspender',
        unsuspend: 'Reactivar',
        suspended: 'Suspendido',
        message: 'Mensaje',
        itemId: 'ID Artículo',
        itemTitle: 'Título',
        seller: 'Vendedor',
        price: 'Precio',
        remove: 'Eliminar',
        editItem: 'Editar',
        platformStats: 'Estadísticas de la Plataforma',
        totalUsers: 'Usuarios Totales',
        totalItems: 'Artículos Totales',
        activeAuctions: 'Subastas Activas',
        totalValue: 'Valor Total de Artículos',
        messages: 'Mensajes',
        loginRequired: 'Por favor inicia sesión',
        loginButton: 'Iniciar Sesión',
        notAuthorized: 'No tienes autorización para ver esta página.',
        goHome: 'Ir al Inicio',
        actionFailed: 'La acción falló. Intenta de nuevo.',
        orderId: 'Pedido',
        buyer: 'Comprador',
        status: 'Estado',
        amount: 'Monto',
        fulfillment: 'Entrega',
        tracking: 'Rastreo',
        purchased: 'Comprado',
        noOrders: 'Aún no hay pedidos.',
        approveRefund: 'Aprobar reembolso',
        denyReleaseFunds: 'Denegar — liberar fondos',
        resolving: 'Resolviendo…',
        revenueSummary: 'Ingresos Netos (capturados, no reembolsados)',
        refundedSummary: 'Reembolsado',
        ordersByStatus: 'Pedidos por Estado',
        topItems: 'Artículos con Más Ingresos',
        topSellers: 'Vendedores con Más Ingresos',
        topBuyers: 'Compradores con Más Gasto',
        orders30d: 'Pedidos en los Últimos 30 Días',
        revenue: 'Ingresos',
        orderCount: 'Pedidos',
        outstandingBalances: 'Saldos Pendientes de Vendedores',
        payoutHistory: 'Historial de Pagos',
        payOut: 'Pagar',
        outstanding: 'Pendiente',
        note: 'Nota (opcional)',
        notePlaceholder: 'ej. Transferencia bancaria ref #1234',
        cancel: 'Cancelar',
        saving: 'Guardando…',
        confirmPayout: 'Registrar Pago',
        invalidAmount: 'Ingresa un monto válido.',
        noBalances: 'No hay saldos pendientes.',
        noPayouts: 'Aún no se han registrado pagos.',
        paidBy: 'Registrado por',
        loading: 'Cargando…',
        phone: 'Teléfono',
        location: 'Ubicación',
        searchUsers: 'Buscar por nombre, correo, N° de cuenta o teléfono…',
        allStatuses: 'Todos los estados',
        activeOnly: 'Solo activos',
        suspendedOnly: 'Solo suspendidos',
        sortNewest: 'Más recientes',
        sortOldest: 'Más antiguos',
        sortNameAsc: 'Nombre: A→Z',
        sortNameDesc: 'Nombre: Z→A',
        sortEmailAsc: 'Correo: A→Z',
        noUsersMatch: 'Ningún usuario coincide con tu búsqueda o filtros.',
        viewProfile: 'Ver Perfil',
    };

    const isAdmin = !!user?.isAdmin;

    const loadUsers = useCallback(async () => {
        if (!isAdmin) return;
        setLoadingUsers(true);
        try {
            const res = await fetch('/api/admin/list-users');
            if (res.ok) setAllUsers(await res.json());
        } finally {
            setLoadingUsers(false);
        }
    }, [isAdmin]);

    const loadOrders = useCallback(async () => {
        if (!isAdmin) return;
        setLoadingOrders(true);
        try {
            const res = await fetch('/api/admin/orders');
            if (res.ok) setOrders(await res.json());
        } finally {
            setLoadingOrders(false);
        }
    }, [isAdmin]);

    const loadAnalytics = useCallback(async () => {
        if (!isAdmin) return;
        setLoadingAnalytics(true);
        try {
            const res = await fetch('/api/admin/analytics');
            if (res.ok) setAnalytics(await res.json());
        } finally {
            setLoadingAnalytics(false);
        }
    }, [isAdmin]);

    const loadPayouts = useCallback(async () => {
        if (!isAdmin) return;
        setLoadingPayouts(true);
        try {
            const res = await fetch('/api/admin/payouts');
            if (res.ok) setPayoutsData(await res.json());
        } finally {
            setLoadingPayouts(false);
        }
    }, [isAdmin]);

    useEffect(() => { loadUsers(); }, [loadUsers]);
    useEffect(() => { loadOrders(); }, [loadOrders]);
    useEffect(() => { loadAnalytics(); }, [loadAnalytics]);
    useEffect(() => { loadPayouts(); }, [loadPayouts]);

    // Includes every real user the admin can see, not just the ones this
    // session happened to log in/sign up (which is all AuthContext's mock
    // usersMap tracks) — needed so ChatPanel can resolve a target's name.
    const chatUsers = useMemo(() => ({
        ...usersMap,
        ...Object.fromEntries(allUsers.map(u => [u.id, u])),
    }), [usersMap, allUsers]);

    const stats = useMemo(() => {
        const now = new Date().getTime();
        const regularUsers = allUsers.filter(u => !u.isAdmin);
        const activeAuctions = items.filter(i => i.saleType === 'auc' && i.endAt > now);
        const totalsByCurrency = items.reduce((sums, item) => {
            const currency = itemCurrency(item);
            const price = item.saleType === 'auc' ? item.currentBid : item.price;
            sums[currency] = (sums[currency] || 0) + price;
            return sums;
        }, {});

        return {
            totalUsers: regularUsers.length,
            totalItems: items.length,
            activeAuctions: activeAuctions.length,
            totalValue: totalsByCurrency,
        };
    }, [allUsers, items]);

    const visibleUsers = useMemo(() => {
        const qq = normalizeSearch(userQuery.trim());
        let list = allUsers.filter(u => {
            const matchesQuery = !qq || normalizeSearch(
                `${u.profileName} ${u.email} ${u.accountNumber} ${u.countryCode || ''} ${u.phone || ''}`
            ).includes(qq);
            const matchesStatus =
                userStatusFilter === 'all' ||
                (userStatusFilter === 'suspended' ? u.isSuspended : !u.isSuspended);
            return matchesQuery && matchesStatus;
        });

        list = [...list].sort((a, b) => {
            switch (userSort) {
                case 'oldest':
                    return (a.createdAt ?? 0) - (b.createdAt ?? 0);
                case 'nameAsc':
                    return a.profileName.localeCompare(b.profileName, loc === 'en' ? 'en' : 'es', { sensitivity: 'base' });
                case 'nameDesc':
                    return b.profileName.localeCompare(a.profileName, loc === 'en' ? 'en' : 'es', { sensitivity: 'base' });
                case 'emailAsc':
                    return a.email.localeCompare(b.email);
                case 'newest':
                default:
                    return (b.createdAt ?? 0) - (a.createdAt ?? 0);
            }
        });

        return list;
    }, [allUsers, userQuery, userStatusFilter, userSort, loc]);

    // chatUsers (usersMap merged with the full real user list) so this
    // resolves correctly even for sellers who haven't logged in this session.
    const allItems = items.map(item => ({ ...item, sellerName: chatUsers[item.sellerId]?.profileName || 'N/A' }));

    const claimPendingOrders = useMemo(() => orders.filter(o => o.status === 'claim_pending'), [orders]);

    const StatCard = ({ title, value }) => (
        <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="text-sm text-gray-500 font-medium">{title}</h4>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
    );

    const handleToggleSuspend = async (targetUser) => {
        setActionError('');
        try {
            const res = await fetch('/api/admin/suspend-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: targetUser.id, suspended: !targetUser.isSuspended }),
            });
            if (!res.ok) throw new Error('SUSPEND_FAILED');
            const updated = await res.json();
            setAllUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
        } catch {
            setActionError(L.actionFailed);
        }
    };

    const handleOpenMessage = async (targetUser) => {
        setActionError('');
        try {
            const thread = await getOrCreateAdminThread(targetUser.id);
            setMessagingThreadId(thread.id);
        } catch {
            setActionError(L.actionFailed);
        }
    };

    const handleResolveClaim = async (order, decision) => {
        setActionError('');
        setResolvingClaim(order.id);
        try {
            const res = await fetch('/api/admin/resolve-claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: order.id, decision }),
            });
            if (!res.ok) throw new Error('RESOLVE_FAILED');
            const updated = await res.json();
            setOrders(prev => prev.map(o => (o.id === updated.id ? { ...o, ...updated } : o)));
        } catch {
            setActionError(L.actionFailed);
        } finally {
            setResolvingClaim(null);
        }
    };

    const handleRecordPayout = async ({ sellerId, currency, amount, note }) => {
        const res = await fetch('/api/admin/payouts-record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sellerId, currency, amount, note }),
        });
        if (!res.ok) throw new Error('PAYOUT_FAILED');
        await loadPayouts();
    };

    if (!user) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-md border text-center">
                <h2 className="text-2xl font-bold text-gray-800">{L.loginRequired}</h2>
                <button onClick={() => navigate('/login')} className="mt-6 bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                    {L.loginButton}
                </button>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-md border text-center">
                <h2 className="text-2xl font-bold text-gray-800">{L.notAuthorized}</h2>
                <button onClick={() => navigate('/')} className="mt-6 bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                    {L.goHome}
                </button>
            </div>
        );
    }

    const tabs = [
        ['overview', L.tabOverview],
        ['users', L.tabUsers],
        ['items', L.tabItems],
        ['orders', L.tabOrders],
        ['analytics', L.tabAnalytics],
        ['payouts', L.tabPayouts],
    ];

    return (
        <>
            {messagingThreadId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setMessagingThreadId(null)}>
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">{L.messages}</h3>
                            <button type="button" onClick={() => setMessagingThreadId(null)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>
                        <ChatPanel
                            loc={loc}
                            user={user}
                            users={chatUsers}
                            threads={threads}
                            role="seller"
                            activeThreadId={messagingThreadId}
                            onSelectThread={setMessagingThreadId}
                        />
                    </div>
                </div>
            )}
            {payoutTarget && (
                <PayoutModal
                    balance={payoutTarget}
                    loc={loc}
                    L={L}
                    onClose={() => setPayoutTarget(null)}
                    onSubmit={handleRecordPayout}
                />
            )}
            {viewingUserId && (
                <AdminUserDetailModal
                    userId={viewingUserId}
                    loc={loc}
                    onClose={() => setViewingUserId(null)}
                    onUserUpdated={(updated) => setAllUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)))}
                />
            )}
            {editingItem && (
                <AdminItemEditModal
                    item={editingItem}
                    loc={loc}
                    onClose={() => setEditingItem(null)}
                    onSaved={replaceItem}
                />
            )}
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-gray-800">{L.title}</h1>

                {actionError && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{actionError}</div>}

                <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
                    {tabs.map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === key ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {label}
                            {key === 'orders' && claimPendingOrders.length > 0 && (
                                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{claimPendingOrders.length}</span>
                            )}
                        </button>
                    ))}
                </div>

                {tab === 'overview' && (
                    <div className="bg-white p-6 rounded-lg shadow-md border">
                        <h2 className="text-2xl font-bold mb-4">{L.platformStats}</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard title={L.totalUsers} value={stats.totalUsers} />
                            <StatCard title={L.totalItems} value={stats.totalItems} />
                            <StatCard title={L.activeAuctions} value={stats.activeAuctions} />
                            <StatCard title={L.totalValue} value={formatMoneyTotals(stats.totalValue, loc) || '—'} />
                        </div>
                    </div>
                )}

                {tab === 'users' && (
                    <div className="bg-white p-6 rounded-lg shadow-md border">
                        <h2 className="text-2xl font-bold mb-4">{L.userManagement}</h2>
                        <div className="flex flex-wrap gap-3 mb-4">
                            <input
                                type="text"
                                value={userQuery}
                                onChange={(e) => setUserQuery(e.target.value)}
                                placeholder={L.searchUsers}
                                className="flex-1 min-w-[220px] border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 p-2.5 border text-sm"
                            />
                            <select
                                value={userStatusFilter}
                                onChange={(e) => setUserStatusFilter(e.target.value)}
                                className="border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 p-2.5 border text-sm"
                            >
                                <option value="all">{L.allStatuses}</option>
                                <option value="active">{L.activeOnly}</option>
                                <option value="suspended">{L.suspendedOnly}</option>
                            </select>
                            <select
                                value={userSort}
                                onChange={(e) => setUserSort(e.target.value)}
                                className="border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 p-2.5 border text-sm"
                            >
                                <option value="newest">{L.sortNewest}</option>
                                <option value="oldest">{L.sortOldest}</option>
                                <option value="nameAsc">{L.sortNameAsc}</option>
                                <option value="nameDesc">{L.sortNameDesc}</option>
                                <option value="emailAsc">{L.sortEmailAsc}</option>
                            </select>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">{L.accountNumber}</th>
                                        <th scope="col" className="px-6 py-3">{L.profileName}</th>
                                        <th scope="col" className="px-6 py-3">{L.email}</th>
                                        <th scope="col" className="px-6 py-3">{L.phone}</th>
                                        <th scope="col" className="px-6 py-3">{L.location}</th>
                                        <th scope="col" className="px-6 py-3">{L.actions}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingUsers && (
                                        <tr><td className="px-6 py-4" colSpan={6}>{L.loading}</td></tr>
                                    )}
                                    {!loadingUsers && visibleUsers.length === 0 && (
                                        <tr><td className="px-6 py-4" colSpan={6}>{L.noUsersMatch}</td></tr>
                                    )}
                                    {visibleUsers.map(u => (
                                        <tr key={u.id} className="bg-white border-b">
                                            <td className="px-6 py-4">{u.accountNumber}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {u.profileName}
                                                {u.isSuspended && (
                                                    <span className="ml-2 text-xs font-semibold text-red-600 uppercase">{L.suspended}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">{u.email}</td>
                                            <td className="px-6 py-4">{u.countryCode} {u.phone}</td>
                                            <td className="px-6 py-4">{[u.city, u.province].filter(Boolean).join(', ') || '—'}</td>
                                            <td className="px-6 py-4 space-x-4">
                                                <button onClick={() => setViewingUserId(u.id)} className="font-medium text-purple-600 hover:underline">{L.viewProfile}</button>
                                                <button onClick={() => handleOpenMessage(u)} className="font-medium text-blue-600 hover:underline" disabled={u.isAdmin}>{L.message}</button>
                                                <button onClick={() => handleToggleSuspend(u)} className="font-medium text-red-600 hover:underline" disabled={u.isAdmin}>
                                                    {u.isSuspended ? L.unsuspend : L.suspend}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {tab === 'items' && (
                    <div className="bg-white p-6 rounded-lg shadow-md border">
                        <h2 className="text-2xl font-bold mb-4">{L.itemManagement}</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">{L.itemId}</th>
                                        <th scope="col" className="px-6 py-3">{L.itemTitle}</th>
                                        <th scope="col" className="px-6 py-3">{L.seller}</th>
                                        <th scope="col" className="px-6 py-3">{L.price}</th>
                                        <th scope="col" className="px-6 py-3">{L.actions}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allItems.map(item => (
                                        <tr key={item.id} className="bg-white border-b">
                                            <td className="px-6 py-4">{item.id}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                <a href={`/item/${item.id}`} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">{item.title}</a>
                                            </td>
                                            <td className="px-6 py-4">{item.sellerName}</td>
                                            <td className="px-6 py-4">{CRC(item.price || item.currentBid, loc, itemCurrency(item))}</td>
                                            <td className="px-6 py-4 space-x-4">
                                                <button onClick={() => setEditingItem(item)} className="font-medium text-blue-600 hover:underline">{L.editItem}</button>
                                                <button onClick={() => removeItem(item.id)} className="font-medium text-red-600 hover:underline">{L.remove}</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {tab === 'orders' && (
                    <div className="bg-white p-6 rounded-lg shadow-md border">
                        <h2 className="text-2xl font-bold mb-4">{L.tabOrders}</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-4 py-3">{L.orderId}</th>
                                        <th scope="col" className="px-4 py-3">{L.itemTitle}</th>
                                        <th scope="col" className="px-4 py-3">{L.buyer}</th>
                                        <th scope="col" className="px-4 py-3">{L.seller}</th>
                                        <th scope="col" className="px-4 py-3">{L.status}</th>
                                        <th scope="col" className="px-4 py-3">{L.amount}</th>
                                        <th scope="col" className="px-4 py-3">{L.fulfillment}</th>
                                        <th scope="col" className="px-4 py-3">{L.tracking}</th>
                                        <th scope="col" className="px-4 py-3">{L.actions}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingOrders && (
                                        <tr><td className="px-4 py-4" colSpan={9}>{L.loading}</td></tr>
                                    )}
                                    {!loadingOrders && orders.length === 0 && (
                                        <tr><td className="px-4 py-4" colSpan={9}>{L.noOrders}</td></tr>
                                    )}
                                    {orders.map(o => (
                                        <tr key={o.id} className="bg-white border-b align-top">
                                            <td className="px-4 py-3 font-mono text-xs">{o.id}</td>
                                            <td className="px-4 py-3">{o.itemTitle}</td>
                                            <td className="px-4 py-3">{o.buyerName}</td>
                                            <td className="px-4 py-3">{o.sellerName}</td>
                                            <td className="px-4 py-3">{buyerStatusLabel(o, loc)}</td>
                                            <td className="px-4 py-3">{money(o.amount + (o.shippingCost || 0), o.currency, loc)}</td>
                                            <td className="px-4 py-3">{o.fulfillment}</td>
                                            <td className="px-4 py-3">{o.trackingNumber || '—'}</td>
                                            <td className="px-4 py-3">
                                                {o.status === 'claim_pending' && (
                                                    <div className="flex flex-col gap-1">
                                                        <button
                                                            onClick={() => handleResolveClaim(o, 'approve')}
                                                            disabled={resolvingClaim === o.id}
                                                            className="font-medium text-red-600 hover:underline text-left disabled:opacity-50"
                                                        >
                                                            {resolvingClaim === o.id ? L.resolving : L.approveRefund}
                                                        </button>
                                                        <button
                                                            onClick={() => handleResolveClaim(o, 'deny')}
                                                            disabled={resolvingClaim === o.id}
                                                            className="font-medium text-green-600 hover:underline text-left disabled:opacity-50"
                                                        >
                                                            {resolvingClaim === o.id ? L.resolving : L.denyReleaseFunds}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {tab === 'analytics' && (
                    <div className="space-y-6">
                        {loadingAnalytics && <div className="bg-white p-6 rounded-lg shadow-md border">{L.loading}</div>}
                        {analytics && (
                            <>
                                <div className="bg-white p-6 rounded-lg shadow-md border">
                                    <h2 className="text-2xl font-bold mb-4">{L.revenueSummary}</h2>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {analytics.revenueByCurrency.map(r => (
                                            <StatCard key={r.currency} title={`${r.currency} (${r.orders} ${L.orderCount.toLowerCase()})`} value={money(r.revenue, r.currency, loc)} />
                                        ))}
                                        {analytics.revenueByCurrency.length === 0 && <p className="text-gray-500 col-span-full">—</p>}
                                    </div>
                                    {analytics.refundedByCurrency.length > 0 && (
                                        <div className="mt-4 pt-4 border-t">
                                            <h3 className="text-sm font-semibold text-gray-500 mb-2">{L.refundedSummary}</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {analytics.refundedByCurrency.map(r => (
                                                    <StatCard key={r.currency} title={`${r.currency} (${r.orders} ${L.orderCount.toLowerCase()})`} value={money(r.revenue, r.currency, loc)} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white p-6 rounded-lg shadow-md border">
                                    <h2 className="text-xl font-bold mb-4">{L.ordersByStatus}</h2>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {Object.entries(analytics.statusCounts).map(([status, count]) => (
                                            <StatCard key={status} title={status} value={count} />
                                        ))}
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-lg shadow-md border">
                                        <h2 className="text-xl font-bold mb-4">{L.topSellers}</h2>
                                        <table className="w-full text-sm text-left text-gray-500">
                                            <tbody>
                                                {analytics.topSellers.map((r, i) => (
                                                    <tr key={i} className="border-b">
                                                        <td className="py-2">{r.sellerName}</td>
                                                        <td className="py-2 text-right">{money(r.revenue, r.currency, loc)}</td>
                                                        <td className="py-2 text-right text-gray-400">{r.orders}</td>
                                                    </tr>
                                                ))}
                                                {analytics.topSellers.length === 0 && <tr><td className="py-2 text-gray-400">—</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="bg-white p-6 rounded-lg shadow-md border">
                                        <h2 className="text-xl font-bold mb-4">{L.topBuyers}</h2>
                                        <table className="w-full text-sm text-left text-gray-500">
                                            <tbody>
                                                {analytics.topBuyers.map((r, i) => (
                                                    <tr key={i} className="border-b">
                                                        <td className="py-2">{r.buyerName}</td>
                                                        <td className="py-2 text-right">{money(r.revenue, r.currency, loc)}</td>
                                                        <td className="py-2 text-right text-gray-400">{r.orders}</td>
                                                    </tr>
                                                ))}
                                                {analytics.topBuyers.length === 0 && <tr><td className="py-2 text-gray-400">—</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-lg shadow-md border">
                                    <h2 className="text-xl font-bold mb-4">{L.topItems}</h2>
                                    <table className="w-full text-sm text-left text-gray-500">
                                        <tbody>
                                            {analytics.topItems.map((r, i) => (
                                                <tr key={i} className="border-b">
                                                    <td className="py-2">{r.itemTitle}</td>
                                                    <td className="py-2 text-gray-400">{r.sellerName}</td>
                                                    <td className="py-2 text-right">{money(r.revenue, r.currency, loc)}</td>
                                                    <td className="py-2 text-right text-gray-400">{r.orders}</td>
                                                </tr>
                                            ))}
                                            {analytics.topItems.length === 0 && <tr><td className="py-2 text-gray-400">—</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {tab === 'payouts' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow-md border">
                            <h2 className="text-2xl font-bold mb-4">{L.outstandingBalances}</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3">{L.seller}</th>
                                            <th className="px-4 py-3">{L.outstanding}</th>
                                            <th className="px-4 py-3">{L.actions}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingPayouts && (
                                            <tr><td className="px-4 py-4" colSpan={3}>{L.loading}</td></tr>
                                        )}
                                        {!loadingPayouts && payoutsData.balances.length === 0 && (
                                            <tr><td className="px-4 py-4" colSpan={3}>{L.noBalances}</td></tr>
                                        )}
                                        {payoutsData.balances.map((b, i) => (
                                            <tr key={i} className="bg-white border-b">
                                                <td className="px-4 py-3 font-medium text-gray-900">{b.sellerName}</td>
                                                <td className="px-4 py-3">{money(b.outstanding, b.currency, loc)}</td>
                                                <td className="px-4 py-3">
                                                    <button onClick={() => setPayoutTarget(b)} className="font-medium text-purple-600 hover:underline">{L.payOut}</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md border">
                            <h2 className="text-xl font-bold mb-4">{L.payoutHistory}</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3">{L.seller}</th>
                                            <th className="px-4 py-3">{L.amount}</th>
                                            <th className="px-4 py-3">{L.note}</th>
                                            <th className="px-4 py-3">{L.purchased}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {!loadingPayouts && payoutsData.history.length === 0 && (
                                            <tr><td className="px-4 py-4" colSpan={4}>{L.noPayouts}</td></tr>
                                        )}
                                        {payoutsData.history.map(p => (
                                            <tr key={p.id} className="bg-white border-b">
                                                <td className="px-4 py-3">{p.sellerName}</td>
                                                <td className="px-4 py-3">{money(p.amount, p.currency, loc)}</td>
                                                <td className="px-4 py-3">{p.note || '—'}</td>
                                                <td className="px-4 py-3">{new Date(p.paidOutAt).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default AdminPage;
