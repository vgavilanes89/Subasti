import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useItems } from '../context/ItemsContext';
import { PLACEHOLDER_IMG, CRC } from '../components/Shared';

// --- Sub-component for Listings/Favorites Grid ---
const ProfilePageItemList = ({list, emptyMsg, onOpen, onToggleFav, isFav, loc, L}) => (
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
                    <div className="text-sm font-bold mt-1">{CRC(it.price || it.currentBid, loc)}</div>
                </div>
            </div>
        )) : <p className="col-span-full text-sm text-gray-500">{emptyMsg}</p>}
    </div>
);

const ProfilePage = ({loc}) => {
    const { user, updateProfile } = useAuth();
    const { items, favorites, isFav, toggleFav } = useItems();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(user || {});
    // Note: We are keeping the "editingAddress/Payment" logic simple here for brevity. 
    // In a full implementation, you might want modals for adding addresses/cards.

    const L = loc === 'en' ? { 
        title: 'My Profile', details: 'My Details', profileName: 'Profile Name', accountNumber: 'Account Number', realName: 'Full Name', email: 'Email', phone: 'Phone', location: 'Location',
        listings: 'My Listings', favs: 'My Favorites', noListings: 'You have not listed any items.', noFavs: 'You have no favorite items.',
        edit: 'Edit', save: 'Save Changes', cancel: 'Cancel', delete: 'Delete',
        favAdd: 'Add to favorites', favRemove: 'Remove from favorites'
    } : { 
        title: 'Mi Perfil', details: 'Mis Datos', profileName: 'Nombre de Perfil', accountNumber: 'Número de Cuenta', realName: 'Nombre Completo', email: 'Correo', phone: 'Teléfono', location: 'Ubicación',
        listings: 'Mis Artículos', favs: 'Mis Favoritos', noListings: 'No has publicado ningún artículo.', noFavs: 'No tienes artículos favoritos.',
        edit: 'Editar', save: 'Guardar Cambios', cancel: 'Cancelar', delete: 'Eliminar',
        favAdd: 'Agregar a favoritos', favRemove: 'Quitar de favoritos'
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

    const myListings = items.filter(i => i.sellerId === user.id);
    const myFavorites = items.filter(i => favorites.includes(i.id));

    const handleOpen = (id) => {
        navigate(`/item/${id}`);
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">{L.title}</h2>
                    {!isEditing && <button onClick={() => setIsEditing(true)} className="text-sm font-semibold text-purple-600 hover:underline">{L.edit}</button>}
                </div>

                {isEditing ? (
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-1">{L.profileName}</label>
                            <input type="text" name="profileName" value={formData.profileName} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"/>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-1">{L.realName}</label>
                            <input type="text" name="realName" value={formData.realName} disabled className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"/>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-1">{L.email}</label>
                            <input type="email" name="email" value={formData.email} disabled className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"/>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-1">{L.phone}</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"/>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-1">{L.location}</label>
                            <input type="text" name="location" value={`${formData.city}, ${formData.province}`} disabled className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"/>
                        </div>

                        <div className="flex items-center gap-4 pt-2">
                            <button type="submit" className="bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors">{L.save}</button>
                            <button type="button" onClick={() => {setIsEditing(false); setFormData(user);}} className="text-sm font-semibold text-gray-600 hover:underline">{L.cancel}</button>
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

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{L.listings}</h3>
                <ProfilePageItemList list={myListings} emptyMsg={L.noListings} onOpen={handleOpen} onToggleFav={toggleFav} isFav={isFav} loc={loc} L={L} />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{L.favs}</h3>
                <ProfilePageItemList list={myFavorites} emptyMsg={L.noFavs} onOpen={handleOpen} onToggleFav={toggleFav} isFav={isFav} loc={loc} L={L} />
            </div>
        </div>
    );
}

export default ProfilePage;