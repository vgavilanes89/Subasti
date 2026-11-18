import React, { useState } from 'react';
import PasswordChecklist, { PASSWORD_PROBLEM_TEXT } from './PasswordChecklist';
import { checkPassword, PASSWORD_MAX } from '../lib/passwordPolicy';

// "Change password" for a logged-in user (Profile → Overview). Needs the
// current password; the new one follows the site-wide policy.
const ChangePasswordSection = ({ loc, user }) => {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ current: '', next: '', confirm: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    const L = loc === 'en' ? {
        title: 'Password',
        intro: 'Use a password you do not use anywhere else.',
        change: 'Change password',
        current: 'Current password',
        next: 'New password',
        confirm: 'Confirm new password',
        save: 'Save new password',
        saving: 'Saving…',
        cancel: 'Cancel',
        done: 'Your password was changed. We also sent you an email to confirm.',
        errors: {
            WRONG_PASSWORD: 'Your current password is not correct.',
            SAME_PASSWORD: 'Choose a password different from your current one.',
            MISMATCH: 'The two new passwords do not match.',
            TOO_MANY_ATTEMPTS: 'Too many attempts. Please wait a few minutes and try again.',
            TRY_AGAIN: 'Something changed while saving. Please try again.',
            REQUEST_FAILED: 'Something went wrong. Please try again.',
        },
    } : {
        title: 'Contraseña',
        intro: 'Usa una contraseña que no uses en ningún otro sitio.',
        change: 'Cambiar contraseña',
        current: 'Contraseña actual',
        next: 'Nueva contraseña',
        confirm: 'Confirmar nueva contraseña',
        save: 'Guardar nueva contraseña',
        saving: 'Guardando…',
        cancel: 'Cancelar',
        done: 'Tu contraseña fue cambiada. También te enviamos un correo de confirmación.',
        errors: {
            WRONG_PASSWORD: 'Tu contraseña actual no es correcta.',
            SAME_PASSWORD: 'Elige una contraseña distinta a la actual.',
            MISMATCH: 'Las dos contraseñas nuevas no coinciden.',
            TOO_MANY_ATTEMPTS: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
            TRY_AGAIN: 'Algo cambió mientras se guardaba. Inténtalo de nuevo.',
            REQUEST_FAILED: 'Algo salió mal. Inténtalo de nuevo.',
        },
    };

    const context = { email: user?.email, profileName: user?.profileName, realName: user?.realName, cedula: user?.cedula };
    const policy = checkPassword(form.next, context);
    const set = (name) => (e) => setForm(prev => ({ ...prev, [name]: e.target.value }));

    const reset = () => { setForm({ current: '', next: '', confirm: '' }); setError(''); setOpen(false); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setDone(false);
        if (!policy.ok) { setError(PASSWORD_PROBLEM_TEXT[loc][policy.problems[0]]); return; }
        if (form.next !== form.confirm) { setError(L.errors.MISMATCH); return; }
        setSaving(true);
        try {
            const res = await fetch('/api/account/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
            });
            const body = await res.json().catch(() => ({}));
            if (res.ok) {
                setForm({ current: '', next: '', confirm: '' });
                setOpen(false);
                setDone(true);
            } else if (body.error === 'WEAK_PASSWORD') {
                setError(PASSWORD_PROBLEM_TEXT[loc][(body.problems || [])[0]] || L.errors.REQUEST_FAILED);
            } else {
                setError(L.errors[body.error] || L.errors.REQUEST_FAILED);
            }
        } catch {
            setError(L.errors.REQUEST_FAILED);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200" id="change-password">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">{L.title}</h3>
                    <p className="text-sm text-gray-600">{L.intro}</p>
                </div>
                {!open && (
                    <button type="button" className="seller-action-btn" onClick={() => { setDone(false); setOpen(true); }}>{L.change}</button>
                )}
            </div>

            {done && !open && <div className="seller-notice seller-notice--ok mt-3 text-sm">{L.done}</div>}

            {open && (
                <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-sm max-w-md">
                    <div>
                        <label className="block font-semibold text-gray-700 mb-1">{L.current}</label>
                        <input type="password" value={form.current} onChange={set('current')} className="seller-input w-full" autoComplete="current-password" required />
                    </div>
                    <div>
                        <label className="block font-semibold text-gray-700 mb-1">{L.next}</label>
                        <input type="password" value={form.next} onChange={set('next')} className="seller-input w-full" autoComplete="new-password" maxLength={PASSWORD_MAX} required />
                        <PasswordChecklist password={form.next} context={context} loc={loc} />
                    </div>
                    <div>
                        <label className="block font-semibold text-gray-700 mb-1">{L.confirm}</label>
                        <input type="password" value={form.confirm} onChange={set('confirm')} className="seller-input w-full" autoComplete="new-password" maxLength={PASSWORD_MAX} required />
                    </div>
                    {error && <p className="text-red-600" role="alert">{error}</p>}
                    <div className="flex gap-3">
                        <button type="submit" disabled={saving || !policy.ok || !form.current || !form.confirm} className="seller-action-btn">{saving ? L.saving : L.save}</button>
                        <button type="button" onClick={reset} className="buyer-order-link-btn">{L.cancel}</button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ChangePasswordSection;
