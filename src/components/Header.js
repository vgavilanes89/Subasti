import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import logoImage from '../images/istockphoto-691094018-612x612.jpg';

const Header = ({ loc, setLoc }) => {
    const { user, logout } = useAuth();
    const { cartCount } = useCart();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        setMenuOpen(false);
        navigate('/');
    };

    return (
        <header className="bg-white shadow-md sticky top-0 z-50 border-b">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-purple-600">
                        <img src={logoImage} alt="Subasti Logo" className="h-10 w-10 object-contain" />
                        <span className="mt-1">SUBASTI</span>
                    </Link>

                    {/* Navigation Actions */}
                    <div className="flex items-center space-x-2">
                        {/* Language Toggle */}
                        <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-purple-600 rounded-md" onClick={() => setLoc(loc === 'es' ? 'en' : 'es')}>
                            {loc === 'es' ? 'EN' : 'ES'}
                        </button>

                        {/* Admin Link */}
                        {user?.isAdmin && (
                            <Link to="/admin" className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 rounded-md">
                                Admin
                            </Link>
                        )}

                        {/* Favorites */}
                        {user && !user.isAdmin && (
                            <Link to="/favorites" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-purple-600 rounded-md">
                                {loc === 'en' ? 'Favorites' : 'Favoritos'}
                            </Link>
                        )}

                        {/* Cart */}
                        <Link to="/cart" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-purple-600 rounded-md">
                            {loc === 'en' ? 'Cart' : 'Carrito'} 
                            {cartCount > 0 && <span className="ml-1 bg-purple-500 text-white text-xs font-bold rounded-full px-2 py-1">{cartCount}</span>}
                        </Link>

                        {/* Sell Button */}
                        <Link to={user ? "/sell" : "/login"} className="hidden md:block bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-600 transition-colors">
                            {loc === 'en' ? 'Sell' : 'Vender'}
                        </Link>

                        {/* User Menu / Login Buttons */}
                        {user ? (
                            <div className="relative">
                                <button onClick={() => setMenuOpen(o => !o)} className="capitalize text-gray-600 hover:text-purple-600">
                                    {loc === 'en' ? 'Hi' : 'Hola'}, {user.profileName.split(' ')[0]}
                                </button>
                                {menuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 z-50 border">
                                        <Link to="/profile" className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>
                                            {loc === 'en' ? 'Profile' : 'Perfil'}
                                        </Link>
                                        <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={handleLogout}>
                                            {loc === 'en' ? 'Sign out' : 'Cerrar sesión'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="hidden md:flex items-center space-x-2">
                                <Link to="/login" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-purple-600 rounded-md">
                                    {loc === 'en' ? 'Log in' : 'Iniciar sesión'}
                                </Link>
                                <Link to="/signup" className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                                    {loc === 'en' ? 'Sign up' : 'Crear cuenta'}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;