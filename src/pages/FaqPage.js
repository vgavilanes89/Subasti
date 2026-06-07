import React, { useState } from 'react';
import { StaticPage } from '../components/StaticPage';

const FaqItem = ({ question, answer, isOpen, onToggle }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
            type="button"
            onClick={onToggle}
            className="w-full flex justify-between items-center p-4 text-left font-semibold text-gray-900 hover:bg-gray-50"
        >
            <span>{question}</span>
            <span className="text-purple-600 text-xl leading-none">{isOpen ? '−' : '+'}</span>
        </button>
        {isOpen && (
            <div className="px-4 pb-4 text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50">
                {answer}
            </div>
        )}
    </div>
);

const FaqPage = ({ loc }) => {
    const [openIndex, setOpenIndex] = useState(0);

    const faqs = loc === 'en' ? [
        { q: 'How do I create an account?', a: 'Click Sign up, enter your cédula and contact details, and choose a public profile name. You can start buying or selling immediately after registering.' },
        { q: 'Can I pay in colones or dollars?', a: 'Each listing is priced in either CRC or USD by the seller. Checkout shows totals in that listing\'s currency.' },
        { q: 'How do auctions work?', a: 'Enter a bid at or above the minimum shown. The highest bid when the timer ends wins, provided the reserve price (if set) is met.' },
        { q: 'What payment methods are accepted?', a: 'Checkout supports credit/debit cards and SINPE Móvil, depending on what you configure in your profile.' },
        { q: 'How does shipping work?', a: 'Sellers choose shipping, local pickup, or both. Shipping costs are shown on the listing and added at checkout when applicable.' },
        { q: 'How do I contact a seller?', a: 'Open the item page and view the seller profile for ratings and listings. For platform issues, use the Contact page.' },
    ] : [
        { q: '¿Cómo creo una cuenta?', a: 'Haga clic en Crear cuenta, ingrese su cédula y datos de contacto, y elija un nombre de perfil público. Puede comprar o vender de inmediato después de registrarse.' },
        { q: '¿Puedo pagar en colones o dólares?', a: 'Cada publicación tiene precio en CRC o USD según el vendedor. El checkout muestra totales en la moneda de esa publicación.' },
        { q: '¿Cómo funcionan las subastas?', a: 'Ingrese una puja igual o mayor al mínimo indicado. Gana la oferta más alta al terminar el tiempo, si se alcanza el precio de reserva (si aplica).' },
        { q: '¿Qué métodos de pago se aceptan?', a: 'El checkout admite tarjetas de crédito/débito y SINPE Móvil, según lo configure en su perfil.' },
        { q: '¿Cómo funciona el envío?', a: 'Los vendedores eligen envío, recogida local o ambos. Los costos de envío se muestran en la publicación y se suman en el checkout cuando corresponda.' },
        { q: '¿Cómo contacto a un vendedor?', a: 'Abra la página del artículo y vea el perfil del vendedor con calificaciones y publicaciones. Para temas de la plataforma, use la página de Contacto.' },
    ];

    const L = loc === 'en'
        ? { title: 'Frequently Asked Questions', subtitle: 'Answers to common questions about Subasti.' }
        : { title: 'Preguntas Frecuentes', subtitle: 'Respuestas a preguntas comunes sobre Subasti.' };

    return (
        <StaticPage title={L.title} subtitle={L.subtitle}>
            <div className="space-y-3">
                {faqs.map((item, index) => (
                    <FaqItem
                        key={item.q}
                        question={item.q}
                        answer={item.a}
                        isOpen={openIndex === index}
                        onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
                    />
                ))}
            </div>
        </StaticPage>
    );
};

export default FaqPage;
