import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TOPIC_KEYS = ['order', 'selling', 'account', 'payments', 'complaint', 'other'];

const ContactPage = ({ loc }) => {
    const { user } = useAuth();
    const en = loc === 'en';

    const L = en ? {
        title: 'Contact Us',
        subtitle: "Questions about an order, selling or your account? Send us a message and we'll reply by email within 1 business day.",
        name: 'Your name',
        email: 'Your email',
        topic: 'What is it about?',
        topics: { order: 'An order', selling: 'Selling on Subasti', account: 'My account', payments: 'Payments', complaint: 'A complaint', other: 'Something else' },
        reference: 'Order or item number (optional)',
        referenceHint: 'Helps us find it faster, e.g. ITM-12345678',
        message: 'Message',
        messageHint: 'Tell us what happened and what you would like us to do.',
        send: 'Send message',
        sending: 'Sending…',
        sentTitle: 'Message sent',
        sentText: "Thanks! We received your message and will reply to the email you gave us within 1 business day. Please also check your spam folder.",
        another: 'Send another message',
        errors: {
            NAME_REQUIRED: 'Please enter your name.',
            INVALID_EMAIL: 'Please enter a valid email address.',
            MESSAGE_TOO_SHORT: 'Please write a little more so we can help (at least 10 characters).',
            RATE_LIMITED: "You've sent several messages recently. Please try again in a while.",
            SUPPORT_NOT_CONFIGURED: "Messaging isn't available right now. Please try again later.",
            SEND_FAILED: "We couldn't send your message. Please try again in a moment.",
            NETWORK: "We couldn't reach the server. Check your connection and try again.",
        },
        quickTitle: 'Quick answers',
        quickText: 'Many questions are answered right away:',
        help: 'Help Center',
        helpSub: 'Guides for buying, selling and payments',
        faq: 'FAQ',
        faqSub: 'The most common questions',
        order: 'Problem with an order?',
        orderSub: 'Confirm, release funds or file a claim from your Buying dashboard',
        escrowNote: 'Never share your password or card details in a message. Subasti will never ask for them.',
    } : {
        title: 'Contáctenos',
        subtitle: '¿Preguntas sobre un pedido, vender o tu cuenta? Envíanos un mensaje y te respondemos por correo en un máximo de 1 día hábil.',
        name: 'Tu nombre',
        email: 'Tu correo',
        topic: '¿Sobre qué es?',
        topics: { order: 'Un pedido', selling: 'Vender en Subasti', account: 'Mi cuenta', payments: 'Pagos', complaint: 'Un reclamo', other: 'Otro tema' },
        reference: 'Número de pedido o artículo (opcional)',
        referenceHint: 'Nos ayuda a encontrarlo más rápido, ej. ITM-12345678',
        message: 'Mensaje',
        messageHint: 'Cuéntanos qué pasó y qué te gustaría que hagamos.',
        send: 'Enviar mensaje',
        sending: 'Enviando…',
        sentTitle: 'Mensaje enviado',
        sentText: '¡Gracias! Recibimos tu mensaje y te responderemos al correo que nos diste en un máximo de 1 día hábil. Revisa también tu carpeta de spam.',
        another: 'Enviar otro mensaje',
        errors: {
            NAME_REQUIRED: 'Por favor escribe tu nombre.',
            INVALID_EMAIL: 'Por favor escribe un correo válido.',
            MESSAGE_TOO_SHORT: 'Escribe un poco más para poder ayudarte (mínimo 10 caracteres).',
            RATE_LIMITED: 'Has enviado varios mensajes recientemente. Inténtalo de nuevo más tarde.',
            SUPPORT_NOT_CONFIGURED: 'El envío de mensajes no está disponible por ahora. Inténtalo más tarde.',
            SEND_FAILED: 'No pudimos enviar tu mensaje. Inténtalo de nuevo en un momento.',
            NETWORK: 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
        },
        quickTitle: 'Respuestas rápidas',
        quickText: 'Muchas preguntas se resuelven al instante:',
        help: 'Centro de Ayuda',
        helpSub: 'Guías para comprar, vender y pagos',
        faq: 'Preguntas Frecuentes',
        faqSub: 'Las dudas más comunes',
        order: '¿Problema con un pedido?',
        orderSub: 'Confirma, libera fondos o presenta un reclamo desde tu panel de Compras',
        escrowNote: 'Nunca compartas tu contraseña ni datos de tarjeta en un mensaje. Subasti nunca te los pedirá.',
    };

    const [form, setForm] = useState({
        name: user?.realName || '',
        email: user?.email || '',
        topic: 'order',
        reference: '',
        message: '',
        website: '', // honeypot — hidden from people, bots fill it
    });
    const [status, setStatus] = useState('idle'); // idle | sending | sent
    const [error, setError] = useState('');

    // The account may finish loading after first render; fill blanks only.
    React.useEffect(() => {
        if (!user) return;
        setForm(prev => ({ ...prev, name: prev.name || user.realName || '', email: prev.email || user.email || '' }));
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (status === 'sending') return;
        setError('');
        setStatus('sending');
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(L.errors[data.error] || L.errors.SEND_FAILED);
                setStatus('idle');
                return;
            }
            setStatus('sent');
            setForm(prev => ({ ...prev, message: '', reference: '' }));
        } catch {
            setError(L.errors.NETWORK);
            setStatus('idle');
        }
    };

    const quickLinks = [
        { to: '/help', t: L.help, d: L.helpSub },
        { to: '/faq', t: L.faq, d: L.faqSub },
        { to: '/profile?tab=buying', t: L.order, d: L.orderSub },
    ];

    return (
        <div className="about-page">
            <section className="about-hero about-hero--compact">
                <h1>{L.title}</h1>
                <p>{L.subtitle}</p>
            </section>

            <div className="contact-layout">
                <section className="about-card contact-form-card">
                    {status === 'sent' ? (
                        <div className="contact-sent" role="status">
                            <div className="contact-sent-icon" aria-hidden>✓</div>
                            <h2>{L.sentTitle}</h2>
                            <p>{L.sentText}</p>
                            <button type="button" className="about-btn about-btn--navy" onClick={() => setStatus('idle')}>{L.another}</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="contact-form" noValidate>
                            <div className="contact-row">
                                <label className="contact-field">
                                    <span>{L.name}</span>
                                    <input type="text" name="name" value={form.name} onChange={handleChange} required maxLength={100} autoComplete="name" />
                                </label>
                                <label className="contact-field">
                                    <span>{L.email}</span>
                                    <input type="email" name="email" value={form.email} onChange={handleChange} required maxLength={200} autoComplete="email" />
                                </label>
                            </div>
                            <div className="contact-row">
                                <label className="contact-field">
                                    <span>{L.topic}</span>
                                    <select name="topic" value={form.topic} onChange={handleChange}>
                                        {TOPIC_KEYS.map(k => <option key={k} value={k}>{L.topics[k]}</option>)}
                                    </select>
                                </label>
                                <label className="contact-field">
                                    <span>{L.reference}</span>
                                    <input type="text" name="reference" value={form.reference} onChange={handleChange} maxLength={60} placeholder="ITM-12345678" />
                                    <small>{L.referenceHint}</small>
                                </label>
                            </div>
                            <label className="contact-field">
                                <span>{L.message}</span>
                                <textarea name="message" value={form.message} onChange={handleChange} required rows="6" maxLength={2000} />
                                <small>{L.messageHint}</small>
                            </label>

                            {/* Honeypot: invisible to people, tempting to bots. */}
                            <div className="contact-hp" aria-hidden="true">
                                <label>Website <input type="text" name="website" value={form.website} onChange={handleChange} tabIndex={-1} autoComplete="off" /></label>
                            </div>

                            {error && <p className="contact-error" role="alert">{error}</p>}

                            <button type="submit" className="about-btn about-btn--navy contact-submit" disabled={status === 'sending'}>
                                {status === 'sending' ? L.sending : L.send}
                            </button>
                            <p className="contact-note">{L.escrowNote}</p>
                        </form>
                    )}
                </section>

                <aside className="about-card contact-aside">
                    <h2>{L.quickTitle}</h2>
                    <p>{L.quickText}</p>
                    <ul className="contact-quick">
                        {quickLinks.map(q => (
                            <li key={q.to}>
                                <Link to={q.to}>
                                    <strong>{q.t}</strong>
                                    <span>{q.d}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </aside>
            </div>
        </div>
    );
};

export default ContactPage;
