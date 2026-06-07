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
        { q: 'How does Subasti secure escrow work?', a: 'Your payment is held by Subasti until you receive the item. Sellers ship within 48 hours after payment is secured. You then have 48 hours to release funds or file a claim. If you do nothing, funds auto-release to the seller.' },
        { q: 'When can a seller ship my order?', a: 'Only after your payment is secured in Subasti escrow. Sellers should not ship before then. Once secured, they must ship (or prepare pickup) within 48 hours and post the expected delivery timeframe.' },
        { q: 'How do I release funds or file a claim?', a: 'Go to Profile → Buying after you receive the item, or respond to the email Subasti sends. You can release funds immediately if satisfied, or submit a claim within 48 hours if the item was not as described or was fraudulent.' },
        { q: 'What if the buyer does not pay?', a: 'Sellers may cancel and relist if payment is not received within 48 hours. Until payment is secured, sellers are not required to start shipping.' },
        { q: 'Can I pay in colones or dollars?', a: 'Each listing is priced in either CRC or USD by the seller. Checkout shows totals in that listing\'s currency.' },
        { q: 'How do auctions work?', a: 'Enter a bid at or above the minimum shown. The highest bid when the timer ends wins, provided the reserve price (if set) is met. Winners must pay within 48 hours to secure escrow.' },
        { q: 'What payment methods are accepted?', a: 'Checkout supports credit/debit cards and SINPE Móvil, depending on what you configure in your profile.' },
        { q: 'How do I contact a seller?', a: 'Open the item page and use Message seller, or view the seller profile. For escrow or platform issues, use the Contact page.' },
    ] : [
        { q: '¿Cómo funciona el depósito en garantía de Subasti?', a: 'Su pago lo retiene Subasti hasta que reciba el artículo. Los vendedores envían en 48 horas tras asegurar el pago. Luego tiene 48 horas para liberar fondos o reclamar. Si no responde, los fondos se liberan automáticamente al vendedor.' },
        { q: '¿Cuándo puede enviar el vendedor mi pedido?', a: 'Solo después de que su pago quede asegurado en depósito Subasti. No deben enviar antes. Una vez asegurado, deben enviar (o preparar recogida) en 48 horas e indicar el plazo estimado de entrega.' },
        { q: '¿Cómo libero fondos o presento un reclamo?', a: 'Vaya a Perfil → Compras tras recibir el artículo, o responda al correo de Subasti. Puede liberar fondos de inmediato si está conforme, o reclamar en 48 horas si el artículo no coincide o hubo fraude.' },
        { q: '¿Qué pasa si el comprador no paga?', a: 'El vendedor puede cancelar y republicar si el pago no se recibe en 48 horas. Hasta asegurar el pago, no está obligado a iniciar el envío.' },
        { q: '¿Puedo pagar en colones o dólares?', a: 'Cada publicación tiene precio en CRC o USD según el vendedor. El checkout muestra totales en la moneda de esa publicación.' },
        { q: '¿Cómo funcionan las subastas?', a: 'Ingrese una puja igual o mayor al mínimo indicado. Gana la oferta más alta al terminar el tiempo, si se alcanza el precio de reserva. El ganador debe pagar en 48 horas para asegurar el depósito.' },
        { q: '¿Qué métodos de pago se aceptan?', a: 'El checkout admite tarjetas de crédito/débito y SINPE Móvil, según lo configure en su perfil.' },
        { q: '¿Cómo contacto a un vendedor?', a: 'Abra la página del artículo y use Mensaje al vendedor, o vea el perfil. Para depósito o temas de plataforma, use Contacto.' },
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
