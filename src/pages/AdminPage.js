import React, { useState, useMemo } from 'react';
import { CRC, itemCurrency, formatMoneyTotals } from '../components/Shared';

const MessageUserModal = ({ user, onClose, onSend, L }) => {
    const [message, setMessage] = useState('');
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onSend(user.id, message);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">{L.sendMessageTo} {user.profileName} ({user.email})</h3>
                <form onSubmit={handleSubmit}>
                    <textarea 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full p-2 border rounded-lg h-32"
                        placeholder={`${L.message}...`}
                        required
                    />
                    <div className="flex justify-end gap-4 mt-4">
                        <button type="button" onClick={onClose} className="text-sm font-semibold text-gray-600 hover:underline">{L.cancel}</button>
                        <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700">{L.send}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AdminPage = ({ loc, users, items, onSuspendUser, onRemoveItem, onSendMessageToUser }) => {
    const [messagingUser, setMessagingUser] = useState(null);

    const L = loc === 'en' ? {
        title: 'Admin Dashboard',
        userManagement: 'User Management',
        itemManagement: 'Item Management',
        accountNumber: 'Account #',
        profileName: 'Profile Name',
        email: 'Email',
        actions: 'Actions',
        suspend: 'Suspend',
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
        sendMessageTo: 'Send Message to',
        send: 'Send',
        cancel: 'Cancel',
    } : {
        title: 'Panel de Administración',
        userManagement: 'Gestión de Usuarios',
        itemManagement: 'Gestión de Artículos',
        accountNumber: 'N° de Cuenta',
        profileName: 'Nombre de Perfil',
        email: 'Correo',
        actions: 'Acciones',
        suspend: 'Suspender',
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
        sendMessageTo: 'Enviar Mensaje a',
        send: 'Enviar',
        cancel: 'Cancelar',
    };
    
    const stats = useMemo(() => {
        const now = new Date().getTime();
        const regularUsers = Object.values(users).filter(u => !u.isAdmin);
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
        }
    }, [users, items]);
    
    const allUsers = Object.values(users);
    const allItems = items.map(item => ({...item, sellerName: users[item.sellerId]?.profileName || 'N/A' }));
    
    const StatCard = ({ title, value }) => (
        <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="text-sm text-gray-500 font-medium">{title}</h4>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
    );

    const handleSendMessage = (userId, message) => {
        onSendMessageToUser(userId, message);
        setMessagingUser(null);
    };

    return (
        <>
            {messagingUser && (
                <MessageUserModal 
                    user={messagingUser}
                    onClose={() => setMessagingUser(null)}
                    onSend={handleSendMessage}
                    L={L}
                />
            )}
            <div className="space-y-8">
                <h1 className="text-3xl font-bold text-gray-800">{L.title}</h1>
                
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
                                {allUsers.map(user => (
                                    <tr key={user.id} className="bg-white border-b">
                                        <td className="px-6 py-4">{user.accountNumber}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{user.profileName}</td>
                                        <td className="px-6 py-4">{user.email}</td>
                                        <td className="px-6 py-4 space-x-4">
                                            <button onClick={() => setMessagingUser(user)} className="font-medium text-blue-600 hover:underline" disabled={user.isAdmin}>{L.message}</button>
                                            <button onClick={() => onSuspendUser(user.id)} className="font-medium text-red-600 hover:underline" disabled={user.isAdmin}>{L.suspend}</button>
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
                                            <button onClick={() => onRemoveItem(item.id)} className="font-medium text-red-600 hover:underline">{L.remove}</button>
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