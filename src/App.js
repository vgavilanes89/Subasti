import React, { useState, useMemo } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

// 1. Import Context Providers
import { AuthProvider } from './context/AuthContext';
import { ItemsProvider } from './context/ItemsContext';
import { CartProvider } from './context/CartContext';
import { HomeFilterProvider } from './context/HomeFilterContext';

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
import AboutPage from './pages/AboutPage';
import CareersPage from './pages/CareersPage';
import HelpPage from './pages/HelpPage';
import FaqPage from './pages/FaqPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';

const footerLinkClass = 'hover:text-white transition-colors';

function App() {
  // Local state for language toggling (passed to Header and used in Footer/Banner)
  const [loc, setLoc] = useState('es');

  // Static Categories definition
  const CATEGORIES = useMemo(() => ({
    'Electrónicos': ['Celulares', 'Computadoras', 'Tablets', 'Cámaras', 'Televisores', 'Audio y Video', 'Videojuegos', 'Accesorios Tech', 'Otro'],
    'Hogar': ['Muebles', 'Electrodomésticos', 'Cocina', 'Decoración', 'Jardinería', 'Herramientas', 'Limpieza', 'Otro'],
    'Deportes': ['Ciclismo', 'Fitness', 'Deportes de Equipo', 'Acuáticos', 'Camping', 'Otro'],
    'Moda': ['Ropa de Mujer', 'Ropa de Hombre', 'Ropa Infantil', 'Calzado', 'Accesorios', 'Bolsos', 'Joyería', 'Otro'],
    'Salud y Belleza': ['Cuidado Personal', 'Maquillaje', 'Perfumes', 'Suplementos', 'Otro'],
    'Juguetes y Bebés': ['Juguetes', 'Bebés', 'Juegos de Mesa', 'Otro'],
    'Mascotas': ['Alimentos para Mascotas', 'Accesorios para Mascotas', 'Higiene Animal', 'Otro'],
    'Libros': ['Ficción', 'No Ficción', 'Infantil y Juvenil', 'Académicos', 'Comics y Manga', 'Otro'],
    'Música e Instrumentos': ['Guitarras', 'Teclados', 'Batería y Percusión', 'Audio DJ', 'Otro'],
    'Arte y Artesanía': ['Arte y Dibujo', 'Hecho a Mano', 'Manualidades', 'Otro'],
    'Coleccionables': ['Monedas y Billetes', 'Tarjetas Coleccionables', 'Memorabilia', 'Antigüedades', 'Otro'],
    'Oficina y Escuela': ['Útiles Escolares', 'Muebles de Oficina', 'Impresión', 'Otro'],
    'Jardín y Exterior': ['Plantas', 'Parrillas', 'Muebles de Exterior', 'Otro'],
    'Alimentos': ['Gourmet', 'Bebidas', 'Orgánicos', 'Otro'],
    'Vehículos': ['Repuestos y Accesorios', 'Motos y ATV', 'Llantas y Rines', 'Audio para Carro', 'Otro'],
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
    <AuthProvider>
      <ItemsProvider>
        <CartProvider>
          <HomeFilterProvider>
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
                <Route path="/about" element={<AboutPage loc={loc} />} />
                <Route path="/careers" element={<CareersPage loc={loc} />} />
                <Route path="/help" element={<HelpPage loc={loc} />} />
                <Route path="/faq" element={<FaqPage loc={loc} />} />
                <Route path="/terms" element={<TermsPage loc={loc} />} />
                <Route path="/privacy" element={<PrivacyPage loc={loc} />} />
              </Routes>
            </main>

            {/* Persistent Footer */}
            <footer className="bg-gray-800 text-white">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div>
                    <h3 className="font-bold mb-4">Subasti</h3>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li><Link to="/about" className={footerLinkClass}>{L.about}</Link></li>
                      <li><Link to="/careers" className={footerLinkClass}>{L.careers}</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold mb-4">{L.support}</h3>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li><Link to="/contact" className={footerLinkClass}>{L.contact}</Link></li>
                      <li><Link to="/help" className={footerLinkClass}>{L.help}</Link></li>
                      <li><Link to="/faq" className={footerLinkClass}>{L.faq}</Link></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold mb-4">{L.legal}</h3>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li><Link to="/terms" className={footerLinkClass}>{L.terms}</Link></li>
                      <li><Link to="/privacy" className={footerLinkClass}>{L.privacy}</Link></li>
                    </ul>
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
                  &copy; {new Date().getFullYear()} Subasti. {L.rights}
                </div>
              </div>
            </footer>
            </div>
          </HomeFilterProvider>
        </CartProvider>
      </ItemsProvider>
    </AuthProvider>
  );
}

export default App;