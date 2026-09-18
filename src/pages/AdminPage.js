import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CRC, itemCurrency, formatMoneyTotals } from '../components/Shared';
import { useAuth } from '../context/AuthContext';
import { useItems } from '../context/ItemsContext';
import { useMessages } from '../context/MessagesContext';
import ChatPanel from '../components/ChatPanel';

const AdminPage = ({ loc }) => {
    const navigate = useNavigate();
    const { user, users: usersMap } = useAuth();
    const { items, removeItem } = useItems();
    const { threads, getOrCreateAdminThread } = useMessages();

    const [allUsers, setAllUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [actionError, setActionError] = useState('');
    const [messagingThreadId, setMessagingThreadId] = useState(null);

    const L = loc === 'en' ? {
        title: 'Admin Dashboard',
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
    } : {
        title: 'Panel de Administración',
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

    useEffect(() => { loadUsers(); }, [loadUsers]);

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

    const allItems = items.map(item => ({ ...item, sellerName: usersMap[item.sellerId]?.profileName || 'N/A' }));

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
            <div className="space-y-8">
                <h1 className="text-3xl font-bold text-gray-800">{L.title}</h1>

                {actionError && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{actionError}</div>}

                {/* Statistics */}
                <div className="bg-white p-6 rounded-lg shadow-md border">
                    <h2 className="text-2xl font-bold mb-4">{L.platformStats}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard title={L.totalUsers} value={stats.totalUsers} />
                        <StatCard title={L.totalItems} value={stats.totalItems} />
                        <StatCard title={L.activeAuctions} value={stats.activeAuctions} />
                        <StatCard title={L.totalValue} value={formatMoneyTotals(stats.totalValue, loc) || '—'} />
                    </div>
                </div>

                {/* User Management */}
                <div className="bg-white p-6 rounded-lg shadow-md border">
                    <h2 className="text-2xl font-bold mb-4">{L.userManagement}</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">{L.accountNumber}</th>
                                    <th scope="col" className="px-6 py-3">{L.profileName}</th>
                                    <th scope="col" className="px-6 py-3">{L.email}</th>
                                    <th scope="col" className="px-6 py-3">{L.actions}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingUsers && (
                                    <tr><td className="px-6 py-4" colSpan={4}>…</td></tr>
                                )}
                                {allUsers.map(u => (
                                    <tr key={u.id} className="bg-white border-b">
                                        <td className="px-6 py-4">{u.accountNumber}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {u.profileName}
                                            {u.isSuspended && (
                                                <span className="ml-2 text-xs font-semibold text-red-600 uppercase">{L.suspended}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">{u.email}</td>
                                        <td className="px-6 py-4 space-x-4">
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

                {/* Item Management */}
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
                                        <td className="px-6 py-4 font-medium text-gray-900">{item.title}</td>
                                        <td className="px-6 py-4">{item.sellerName}</td>
                                        <td className="px-6 py-4">{CRC(item.price || item.currentBid, loc, itemCurrency(item))}</td>
                                        <td className="px-6 py-4">
                                            <button onClick={() => removeItem(item.id)} className="font-medium text-red-600 hover:underline">{L.remove}</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminPage;
