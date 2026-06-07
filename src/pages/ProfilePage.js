import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useItems } from '../context/ItemsContext';
import { useMessages } from '../context/MessagesContext';
import SellerDashboard from '../components/SellerDashboard';
import BuyerDashboard from '../components/BuyerDashboard';
import { fetchBuyerOrders } from '../api/orders';

const ProfilePage = ({ loc }) => {
    const { user, users, updateProfile } = useAuth();
    const { items, favorites, isFav, toggleFav } = useItems();
    const { unreadBuyerCount } = useMessages();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'account');
    const [buyerThreadId, setBuyerThreadId] = useState(searchParams.get('thread') || null);
    const [buyerAlertCount, setBuyerAlertCount] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(user || {});

    const L = loc === 'en' ? {
        title: 'My Profile',
        tabAccount: 'Account',
        tabBuying: 'Buying',
        tabSelling: 'Selling',
        profileName: 'Profile Name',
        accountNumber: 'Account Number',
        realName: 'Full Name',
        email: 'Email',
        phone: 'Phone',
        location: 'Location',
        edit: 'Edit',
        save: 'Save Changes',
        cancel: 'Cancel',
    } : {
        title: 'Mi Perfil',
        tabAccount: 'Cuenta',
        tabBuying: 'Compras',
        tabSelling: 'Ventas',
        profileName: 'Nombre de Perfil',
        accountNumber: 'Número de Cuenta',
        realName: 'Nombre Completo',
        email: 'Correo',
        phone: 'Teléfono',
        location: 'Ubicación',
        edit: 'Editar',
        save: 'Guardar Cambios',
        cancel: 'Cancelar',
    };

    useEffect(() => {
        const tab = searchParams.get('tab');
        const thread = searchParams.get('thread');
        if (tab) setActiveTab(tab);
        if (thread) setBuyerThreadId(thread);
    }, [searchParams]);

    useEffect(() => {
        if (!user) return;
        fetchBuyerOrders(user.id).then(orders => {
            const alerts = orders.filter(o =>
                o.status === 'pending_payment' || o.status === 'shipped'
            ).length;
            setBuyerAlertCount(alerts);
        });
    }, [user]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        const next = new URLSearchParams(searchParams);
        next.set('tab', tabId);
        if (tabId !== 'buying') next.delete('thread');
        setSearchParams(next, { replace: true });
    };

    const handleBuyerThreadSelect = (threadId) => {
        setBuyerThreadId(threadId);
        const next = new URLSearchParams(searchParams);
        next.set('tab', 'buying');
        next.set('thread', threadId);
        setSearchParams(next, { replace: true });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        updateProfile(formData);
        setIsEditing(false);
        alert(loc === 'en' ? 'Profile updated!' : '¡Perfil actualizado!');
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

    const tabs = [
        { id: 'account', label: L.tabAccount },
        { id: 'buying', label: L.tabBuying, badge: buyingBadge },
        { id: 'selling', label: L.tabSelling },
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
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800">{L.tabAccount}</h3>
                        {!isEditing && (
                            <button type="button" onClick={() => setIsEditing(true)} className="text-sm font-semibold text-purple-600 hover:underline">{L.edit}</button>
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
                            <div className="flex items-center gap-4 pt-2">
                                <button type="submit" className="bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors">{L.save}</button>
                                <button type="button" onClick={() => { setIsEditing(false); setFormData(user); }} className="text-sm font-semibold text-gray-600 hover:underline">{L.cancel}</button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-2 text-md">
                            <p><span className="font-semibold">{L.accountNumber}:</span> {user.accountNumber}</p>
                            <p><span className="font-semibold">{L.profileName}:</span> {user.profileName}</p>
                            <p><span className="font-semibold">{L.realName}:</span> {user.realName}</p>
                            <p><span className="font-semibold">{L.email}:</span> {user.email}</p>
                            <p><span className="font-semibold">{L.phone}:</span> {user.countryCode} {user.phone}</p>
                            <p><span className="font-semibold">{L.location}:</span> {`${user.city}, ${user.province}`}</p>
                        </div>
                    )}
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
        </div>
    );
};

export default ProfilePage;
