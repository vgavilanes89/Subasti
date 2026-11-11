import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPasswordPage = ({ loc }) => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle | sending | sent
    const [error, setError] = useState('');

    const L = loc === 'en' ? {
        title: 'Forgot your password?',
        intro: "Enter your account email and we'll send you a link to choose a new password.",
        email: 'Email',
        submit: 'Send reset link',
        sending: 'Sending…',
        sent: "If an account exists for that email, we've sent a link to reset your password. It works for 1 hour. Check your spam folder if you don't see it.",
        back: 'Back to log in',
        tooMany: 'Too many attempts. Please wait a minute and try again.',
        failed: 'Something went wrong. Please try again.',
    } : {
        title: '¿Olvidaste tu contraseña?',
        intro: 'Ingresa el correo de tu cuenta y te enviaremos un enlace para elegir una nueva contraseña.',
        email: 'Correo',
        submit: 'Enviar enlace',
        sending: 'Enviando…',
        sent: 'Si existe una cuenta con ese correo, te enviamos un enlace para restablecer tu contraseña. Funciona durante 1 hora. Revisa tu carpeta de spam si no lo ves.',
        back: 'Volver a iniciar sesión',
        tooMany: 'Demasiados intentos. Espera un minuto e intenta de nuevo.',
        failed: 'Algo salió mal. Intenta de nuevo.',
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setStatus('sending');
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (res.status === 429) {
                setError(L.tooMany);
                setStatus('idle');
                return;
            }
            if (!res.ok) throw new Error('REQUEST_FAILED');
            setStatus('sent');
        } catch {
            setError(L.failed);
            setStatus('idle');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-8">
            <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">{L.title}</h2>
                {status === 'sent' ? (
                    <div className="mt-4 p-4 bg-green-50 text-green-800 rounded-lg text-sm">{L.sent}</div>
                ) : (
                    <>
                        <p className="text-sm text-gray-600 text-center mb-6">{L.intro}</p>
                        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="text-sm font-bold text-gray-700 block mb-2">{L.email}</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500" />
                            </div>
                            <button type="submit" disabled={status === 'sending'} className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60">
                                {status === 'sending' ? L.sending : L.submit}
                            </button>
                        </form>
                    </>
                )}
                <p className="text-center text-sm text-gray-600 mt-6">
                    <Link to="/login" className="font-semibold text-purple-600 hover:underline">{L.back}</Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
