import React, { useState } from 'react';
import PasswordChecklist, { PASSWORD_PROBLEM_TEXT } from '../components/PasswordChecklist';
import { checkPassword } from '../lib/passwordPolicy';
import { Link, useSearchParams } from 'react-router-dom';
import PasswordInput from '../components/PasswordInput';

const ResetPasswordPage = ({ loc }) => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [status, setStatus] = useState('idle'); // idle | saving | done
    const [error, setError] = useState('');

    const L = loc === 'en' ? {
        title: 'Choose a new password',
        pass: 'New password',
        confirm: 'Confirm new password',
        hint: '',
        submit: 'Change password',
        saving: 'Saving…',
        done: 'Your password was changed. You can now log in with it.',
        login: 'Log in',
        mismatch: "The two passwords don't match.",
        weak: 'That password does not meet the requirements.',
        invalid: 'This link is invalid or has expired. Request a new one.',
        newLink: 'Request a new link',
        failed: 'Something went wrong. Please try again.',
        tooMany: 'Too many attempts. Please wait a minute and try again.',
    } : {
        title: 'Elige una nueva contraseña',
        pass: 'Nueva contraseña',
        confirm: 'Confirmar nueva contraseña',
        hint: '',
        submit: 'Cambiar contraseña',
        saving: 'Guardando…',
        done: 'Tu contraseña fue cambiada. Ya puedes iniciar sesión con ella.',
        login: 'Iniciar sesión',
        mismatch: 'Las dos contraseñas no coinciden.',
        weak: 'Esa contraseña no cumple los requisitos.',
        invalid: 'Este enlace no es válido o ya venció. Solicita uno nuevo.',
        newLink: 'Solicitar un enlace nuevo',
        failed: 'Algo salió mal. Intenta de nuevo.',
        tooMany: 'Demasiados intentos. Espera un minuto e intenta de nuevo.',
    };

    const [linkInvalid, setLinkInvalid] = useState(!token);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const policy = checkPassword(password);
        if (!policy.ok) { setError(PASSWORD_PROBLEM_TEXT[loc][policy.problems[0]]); return; }
        if (password !== confirm) { setError(L.mismatch); return; }
        setStatus('saving');
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });
            if (res.status === 429) {
                setError(L.tooMany);
                setStatus('idle');
                return;
            }
            const body = await res.json().catch(() => ({}));
            if (res.ok) {
                setStatus('done');
                return;
            }
            if (body.error === 'INVALID_OR_EXPIRED_LINK') {
                setLinkInvalid(true);
            } else if (body.error === 'WEAK_PASSWORD') {
                setError(PASSWORD_PROBLEM_TEXT[loc][(body.problems || [])[0]] || L.weak);
            } else {
                setError(L.failed);
            }
            setStatus('idle');
        } catch {
            setError(L.failed);
            setStatus('idle');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-8">
            <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">{L.title}</h2>
                {status === 'done' ? (
                    <>
                        <div className="p-4 bg-green-50 text-green-800 rounded-lg text-sm">{L.done}</div>
                        <Link to="/login" className="block text-center mt-6 w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">{L.login}</Link>
                    </>
                ) : linkInvalid ? (
                    <>
                        <div className="p-4 bg-red-100 text-red-700 rounded-lg text-sm">{L.invalid}</div>
                        <Link to="/forgot-password" className="block text-center mt-6 font-semibold text-purple-600 hover:underline">{L.newLink}</Link>
                    </>
                ) : (
                    <>
                        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="text-sm font-bold text-gray-700 block mb-2">{L.pass}</label>
                                <PasswordInput loc={loc} value={password} onChange={(e) => setPassword(e.target.value)} required maxLength={200} autoComplete="new-password" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500" />
                                <PasswordChecklist password={password} loc={loc} />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-700 block mb-2">{L.confirm}</label>
                                <PasswordInput loc={loc} value={confirm} onChange={(e) => setConfirm(e.target.value)} required maxLength={200} autoComplete="new-password" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500" />
                            </div>
                            <button type="submit" disabled={status === 'saving'} className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60">
                                {status === 'saving' ? L.saving : L.submit}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;
