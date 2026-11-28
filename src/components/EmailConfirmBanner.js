import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const post = async (body) => {
    const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'REQUEST_FAILED');
    return data;
};

// Shown across the site until a new account confirms its email.
const EmailConfirmBanner = ({ loc }) => {
    const { user, refreshUser } = useAuth();
    const [changing, setChanging] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const pending = Boolean(user?.emailUnconfirmed);

    // The link usually opens in another tab: check again on coming back.
    useEffect(() => {
        if (!pending) return undefined;
        window.addEventListener('focus', refreshUser);
        return () => window.removeEventListener('focus', refreshUser);
    }, [pending, refreshUser]);

    if (!pending) return null;

    const L = loc === 'en' ? {
        title: 'Confirm your email',
        text: (address) => `We sent a link to ${address}. Until you use it you can browse, but not bid, buy, sell, message or review.`,
        resend: 'Send the link again',
        wrong: 'Wrong address?',
        newEmail: 'Correct email address',
        password: 'Your password',
        save: 'Change and send link',
        cancel: 'Cancel',
        sent: 'Link sent. Check your inbox and spam folder.',
        errors: {
            TOO_MANY_REQUESTS: 'Too many attempts. Please wait an hour.',
            EMAIL_SEND_FAILED: 'We could not send the email. Please try later or contact us.',
            INVALID_EMAIL: 'That email address doesn\'t look right.',
            WRONG_PASSWORD: 'That password is not correct.',
            EMAIL_TAKEN: 'That email is already used by another account.',
            REQUEST_FAILED: 'Something went wrong. Please try again.',
        },
    } : {
        title: 'Confirma tu correo',
        text: (address) => `Enviamos un enlace a ${address}. Mientras no lo uses puedes navegar, pero no pujar, comprar, vender, enviar mensajes ni reseñar.`,
        resend: 'Enviar el enlace de nuevo',
        wrong: '¿Correo equivocado?',
        newEmail: 'Correo correcto',
        password: 'Tu contraseña',
        save: 'Cambiar y enviar enlace',
        cancel: 'Cancelar',
        sent: 'Enlace enviado. Revisa tu bandeja de entrada y el correo no deseado.',
        errors: {
            TOO_MANY_REQUESTS: 'Demasiados intentos. Espera una hora.',
            EMAIL_SEND_FAILED: 'No pudimos enviar el correo. Intenta más tarde o contáctanos.',
            INVALID_EMAIL: 'Ese correo no parece correcto.',
            WRONG_PASSWORD: 'La contraseña no es correcta.',
            EMAIL_TAKEN: 'Ese correo ya lo usa otra cuenta.',
            REQUEST_FAILED: 'Algo salió mal. Intenta de nuevo.',
        },
    };

    const run = async (body) => {
        setBusy(true);
        setMessage('');
        try {
            await post(body);
            setMessage(L.sent);
            setChanging(false);
            setPassword('');
        } catch (err) {
            if (err.message === 'ALREADY_CONFIRMED') { refreshUser(); return; }
            setMessage(L.errors[err.message] || L.errors.REQUEST_FAILED);
        } finally {
            setBusy(false);
            // The address shown may have changed.
            if (body.action === 'change') refreshUser();
        }
    };

    return (
        <div className="email-banner" role="status">
            <p><strong>{L.title}.</strong> {L.text(user.email)}</p>
            {!changing ? (
                <div className="email-banner-actions">
                    <button type="button" className="email-banner-btn" disabled={busy} onClick={() => run({ action: 'resend' })}>{L.resend}</button>
                    <button type="button" className="email-banner-btn" onClick={() => { setChanging(true); setMessage(''); }}>{L.wrong}</button>
                </div>
            ) : (
                <form className="email-banner-form" onSubmit={(e) => { e.preventDefault(); run({ action: 'change', email, password }); }}>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={L.newEmail} aria-label={L.newEmail} className="seller-input" />
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={L.password} aria-label={L.password} autoComplete="current-password" className="seller-input" />
                    <button type="submit" className="seller-action-btn" disabled={busy}>{L.save}</button>
                    <button type="button" className="email-banner-btn" onClick={() => setChanging(false)}>{L.cancel}</button>
                </form>
            )}
            {message && <p className="email-banner-message">{message}</p>}
        </div>
    );
};

export default EmailConfirmBanner;
