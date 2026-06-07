import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useItems } from '../context/ItemsContext';
import { useMessages } from '../context/MessagesContext';
import { PLACEHOLDER_IMG, CRC, itemCurrency } from '../components/Shared';
import SellerDashboard from '../components/SellerDashboard';
import ChatPanel from '../components/ChatPanel';

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
                    <button onClick={() => onOpen(it.id)} className="text-sm font-semibold text-gray-800 hover:text-purple-700 text-left line-clamp-2">{it.title}</button>
                    <div className="text-sm font-bold mt-1">{CRC(it.price || it.currentBid, loc, itemCurrency(it))}</div>
                </div>
            </div>
        )) : <p className="col-span-full text-sm text-gray-500">{emptyMsg}</p>}
    </div>
);

const ProfilePage = ({ loc }) => {
    const { user, users, updateProfile } = useAuth();
    const { items, favorites, isFav, toggleFav } = useItems();
    const { buyerThreads, unreadBuyerCount } = useMessages();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'account');
    const [buyerThreadId, setBuyerThreadId] = useState(searchParams.get('thread') || null);
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
        favs: 'My Favorites',
        noFavs: 'You have no favorite items.',
        sellerMessages: 'Messages with sellers',
        edit: 'Edit',
        save: 'Save Changes',
        cancel: 'Cancel',
        favAdd: 'Add to favorites',
        favRemove: 'Remove from favorites',
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
        favs: 'Mis Favoritos',
        noFavs: 'No tienes artículos favoritos.',
        sellerMessages: 'Mensajes con vendedores',
        edit: 'Editar',
        save: 'Guardar Cambios',
        cancel: 'Cancelar',
        favAdd: 'Agregar a favoritos',
        favRemove: 'Quitar de favoritos',
    };

    useEffect(() => {
        const tab = searchParams.get('tab');
        const thread = searchParams.get('thread');
        if (tab) setActiveTab(tab);
        if (thread) setBuyerThreadId(thread);
    }, [searchParams]);

    useEffect(() => {
        if (buyerThreads.length && !buyerThreadId) {
            setBuyerThreadId(buyerThreads[0].id);
        }
    }, [buyerThreads, buyerThreadId]);

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

    const myFavorites = items.filter(i => favorites.includes(i.id));

    const handleOpen = (id) => {
        navigate(`/item/${id}`);
    };

    const tabs = [
        { id: 'account', label: L.tabAccount },
        { id: 'buying', label: L.tabBuying, badge: unreadBuyerCount },
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
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">{L.sellerMessages}</h3>
                        <ChatPanel
                            loc={loc}
                            user={user}
                            users={users}
                            threads={buyerThreads}
                            role="buyer"
                            activeThreadId={buyerThreadId}
                            onSelectThread={handleBuyerThreadSelect}
                            userEmail={user.email}
                        />
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">{L.favs}</h3>
                        <ProfilePageItemList list={myFavorites} emptyMsg={L.noFavs} onOpen={handleOpen} onToggleFav={toggleFav} isFav={isFav} loc={loc} L={L} />
                    </div>
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
