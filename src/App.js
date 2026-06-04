import React, { useState, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';

// 1. Import Context Providers
import { AuthProvider } from './context/AuthContext';
import { ItemsProvider } from './context/ItemsContext';
import { CartProvider } from './context/CartContext';

// 2. Import Layout Components
import Header from './components/Header';

// 3. Import Pages
import HomePage from './pages/HomePage';
import ItemViewPage from './pages/ItemViewPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignUpPage';
import ProfilePage from './pages/ProfilePage';
import SellPage from './pages/SellPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import SellerProfilePage from './pages/SellerProfilePage';
import FavoritesPage from './pages/FavoritesPage';
import AdminPage from './pages/AdminPage';
import ContactPage from './pages/ContactPage';

// Placeholder for static pages
const PlaceholderPage = ({ title }) => (
  <div className="bg-white p-8 rounded-lg shadow-md border text-center m-8">
    <h2 className="text-2xl font-bold">{title}</h2>
    <p className="text-gray-500 mt-2">This page is under construction.</p>
  </div>
);

function App() {
  // Local state for language toggling (passed to Header and used in Footer/Banner)
  const [loc, setLoc] = useState('es');

  // Static Categories definition
  const CATEGORIES = useMemo(() => ({
    'Electrónicos': ['Celulares', 'Computadoras', 'Cámaras', 'Audio y Video', 'Videojuegos', 'Otro'],
    'Hogar': ['Muebles', 'Electrodomésticos', 'Decoración', 'Jardinería', 'Herramientas', 'Otro'],
    'Deportes': ['Ciclismo', 'Fitness', 'Deportes de Equipo', 'Acuáticos', 'Otro'],
    'Moda': ['Ropa de Mujer', 'Ropa de Hombre', 'Calzado', 'Accesorios', 'Bolsos', 'Otro'],
    'Libros': ['Ficción', 'No Ficción', 'Infantil y Juvenil', 'Académicos', 'Comics y Manga', 'Otro'],
    'Vehículos': ['Repuestos y Accesorios', 'Otro'],
  }), []);

  // Localization for Layout elements
  const L = loc === 'en' ? {
    about: 'About Us',
    careers: 'Careers',
    support: 'Support',
    contact: 'Contact Us',
    help: 'Help Center',
    faq: 'FAQ',
    legal: 'Legal',
    terms: 'Terms and Conditions',
    privacy: 'Privacy Policy',
    rights: 'All rights reserved.',
    bannerText: 'Buy and Sell Your Items Now!',
    bannerSubText: 'Join the largest online marketplace in Costa Rica.'
  } : {
    about: 'Sobre Nosotros',
    careers: 'Carreras',
    support: 'Soporte',
    contact: 'Contáctenos',
    help: 'Centro de Ayuda',
    faq: 'Preguntas Frecuentes',
    legal: 'Legal',
    terms: 'Términos y Condiciones',
    privacy: 'Política de Privacidad',
    rights: 'Todos los derechos reservados.',
    bannerText: '¡Compra y Vende Tus Artículos Ahora!',
    bannerSubText: 'Únete al mercado en línea más grande de Costa Rica.'
  };

  return (
    /* Wrap App in Providers to share state globally */
    <AuthProvider>
      <ItemsProvider>
        <CartProvider>
          <div className="bg-gray-50 min-h-screen text-gray-800 font-sans flex flex-col">
            
            {/* Persistent Header */}
            <Header loc={loc} setLoc={setLoc} />

            {/* Banner Section */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <div className="container mx-auto py-8 px-4 text-center">
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{L.bannerText}</h2>
                <p className="mt-2 text-lg text-purple-200">{L.bannerSubText}</p>
              </div>
            </div>

            {/* Main Content Area with Routing */}
            <main className="container mx-auto p-4 sm:p-6 lg:p-8 flex-grow">
              <Routes>
                {/* Core Routes */}
                <Route path="/" element={<HomePage loc={loc} categories={CATEGORIES} />} />
                <Route path="/item/:id" element={<ItemViewPage loc={loc} />} />
                
                {/* Auth Routes */}
                <Route path="/login" element={<LoginPage loc={loc} />} />
                <Route path="/signup" element={<SignupPage loc={loc} />} />
                
                {/* User Routes */}
                <Route path="/profile" element={<ProfilePage loc={loc} />} />
                <Route path="/sell" element={<SellPage loc={loc} categories={CATEGORIES} />} />
                <Route path="/favorites" element={<FavoritesPage loc={loc} />} />
                
                {/* Transaction Routes */}
                <Route path="/cart" element={<CartPage loc={loc} />} />
                <Route path="/checkout" element={<CheckoutPage loc={loc} />} />
                
                {/* Public Profiles */}
                <Route path="/seller/:id" element={<SellerProfilePage loc={loc} />} />
                
                {/* Misc Routes */}
                <Route path="/admin" element={<AdminPage loc={loc} />} />
                <Route path="/contact" element={<ContactPage loc={loc} />} />
                <Route path="/terms" element={<PlaceholderPage title="Terms and Conditions" />} />
              </Routes>
            </main>

            {/* Persistent Footer */}
            <footer className="bg-gray-800 text-white">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div>
                    <h3 className="font-bold mb-4">Subasti</h3>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li className="hover:text-white cursor-pointer">{L.about}</li>
                      <li className="hover:text-white cursor-pointer">{L.careers}</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold mb-4">{L.support}</h3>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li className="hover:text-white cursor-pointer">{L.contact}</li>
                      <li className="hover:text-white cursor-pointer">{L.help}</li>
                      <li className="hover:text-white cursor-pointer">{L.faq}</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold mb-4">{L.legal}</h3>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li className="hover:text-white cursor-pointer">{L.terms}</li>
                      <li className="hover:text-white cursor-pointer">{L.privacy}</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
                  &copy; {new Date().getFullYear()} Subasti. {L.rights}
                </div>
              </div>
            </footer>
          </div>
        </CartProvider>
      </ItemsProvider>
    </AuthProvider>
  );
}

export default App;