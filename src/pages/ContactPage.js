import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const ContactPage = ({ loc }) => {
    const { user } = useAuth();
    const L = loc === 'en' ? {
        title: 'Contact Us',
        subtitle: "We're here to help. Send us a message and we'll get back to you.",
        yourName: 'Your Name',
        yourEmail: 'Your Email',
        message: 'Message',
        sendMessage: 'Send Message',
        sent: 'Message sent! We will get back to you soon.',
        contactInfo: 'Contact Information',
        address: '123 Subasti Ave, San José, Costa Rica',
        phone: '+506 2222-2222',
        email: 'contact@subasti.com',
        whatsapp: 'WhatsApp'
    } : {
        title: 'Contáctenos',
        subtitle: 'Estamos aquí para ayudar. Envíenos un mensaje y le responderemos.',
        yourName: 'Tu Nombre',
        yourEmail: 'Tu Correo Electrónico',
        message: 'Mensaje',
        sendMessage: 'Enviar Mensaje',
        sent: '¡Mensaje enviado! Le responderemos pronto.',
        contactInfo: 'Información de Contacto',
        address: '123 Av. Subasti, San José, Costa Rica',
        phone: '+506 2222-2222',
        email: 'contacto@subasti.com',
        whatsapp: 'WhatsApp'
    };

    const [formData, setFormData] = useState({
        name: user?.realName || '',
        email: user?.email || '',
        message: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        alert(L.sent);
        setFormData(prev => ({ ...prev, message: '' }));
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md border">
            <h1 className="text-3xl font-bold text-center mb-2">{L.title}</h1>
            <p className="text-center text-gray-500 mb-8">{L.subtitle}</p>
            <div className="grid md:grid-cols-2 gap-12">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-2">{L.yourName}</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full p-3 border rounded-lg"/>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-2">{L.yourEmail}</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full p-3 border rounded-lg"/>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-2">{L.message}</label>
                        <textarea name="message" value={formData.message} onChange={handleChange} required rows="5" className="w-full p-3 border rounded-lg"></textarea>
                    </div>
                    <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700">{L.sendMessage}</button>
                </form>
                <div className="space-y-4">
                    <h3 className="text-lg font-bold">{L.contactInfo}</h3>
                    <p className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg> {L.address}</p>
                    <p className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> {L.phone}</p>
                    <p className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> {L.email}</p>
                    <a href="https://wa.me/50688888888" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-green-600 font-semibold hover:underline">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-green-500"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413 0 6.556-5.338 11.891-11.893 11.891-1.995 0-3.903-.52-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.447-4.437-9.886-9.888-9.886-5.448 0-9.886 4.434-9.889 9.885.002 2.17.661 4.223 1.838 5.995l-1.222 4.462 4.631-1.21zM12 4.185c4.463 0 8.111 3.648 8.111 8.111s-3.648 8.111-8.111 8.111-8.111-3.648-8.111-8.111c0-4.463 3.648-8.111 8.111-8.111zm-1.528 5.465l-.328.176c-.232.124-.51.272-.782.52s-.476.544-.658.917c-.183.373-.243.832-.243 1.229.001.077 0 .154.001.231.005.373.111.758.293 1.12.351.714.939 1.341 1.684 1.848.744.508 1.558.857 2.456 1.054.341.074.686.113 1.026.118l.31-.005c.34-.047.674-.149.977-.315.352-.191.644-.452.846-.78.203-.327.311-.702.311-1.073.001-.355-.101-.703-.301-1.004l-.004-.008c-.015-.021-.033-.039-.052-.054l-1.428-1.428c-.08-.08-.189-.126-.301-.126-.112 0-.222.046-.301.126l-.427.427c-.084.084-.199.132-.32.132s-.236-.048-.32-.132l-.004-.004c-.456-.456-.988-.853-1.555-1.189-.251-.148-.518-.282-.789-.395l-.113-.047c-.201-.082-.375-.246-.47-.442l-.244-.509c-.11-.233-.326-.395-.568-.395-.078.001-.157.016-.233.045l-.317.118z"/></svg>
                        {L.whatsapp}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;