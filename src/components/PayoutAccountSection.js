import React, { useState, useEffect } from 'react';
import * as payoutApi from '../api/payoutAccount';

const maskIban = (iban) => (iban ? `${iban.slice(0, 4)} •••• •••• •••• ${iban.slice(-4)}` : '');

const PayoutAccountSection = ({ loc, realName }) => {
    const [account, setAccount] = useState(undefined); // undefined = loading, null = none saved
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ method: 'bank', holderName: '', bankName: '', iban: '', sinpePhone: '' });

    const L = loc === 'en' ? {
        title: 'Payout account',
        intro: 'Where Subasti sends your sale proceeds once the buyer releases the funds.',
        missing: 'Add the account where you want to receive your sales proceeds. Without it, Subasti cannot pay you.',
        method: 'Payment method',
        bank: 'Bank transfer (IBAN)',
        sinpe: 'SINPE Móvil',
        holderName: 'Account holder name',
        holderHelp: 'Must match your verified name',
        bankName: 'Bank name',
        iban: 'IBAN account number',
        ibanHelp: 'Costa Rican IBAN, e.g. CR05015202001026284066',
        sinpePhone: 'SINPE Móvil phone number',
        add: 'Add account',
        save: 'Save account',
        saving: 'Saving…',
        edit: 'Change',
        cancel: 'Cancel',
        remove: 'Remove',
        confirmRemove: 'Remove your payout account? You will need to add one again to be paid.',
        loading: 'Loading…',
        errors: {
            INVALID_HOLDER_NAME: 'Enter the account holder name.',
            INVALID_BANK_NAME: 'Enter the bank name.',
            INVALID_IBAN: 'That IBAN is not valid. Check it and try again (22 characters, starts with CR).',
            INVALID_SINPE_PHONE: 'Enter an 8-digit phone number.',
            REQUEST_FAILED: 'Could not save. Please try again.',
        },
    } : {
        title: 'Cuenta para recibir pagos',
        intro: 'Donde Subasti te envía el dinero de tus ventas cuando el comprador libera los fondos.',
        missing: 'Agrega la cuenta donde quieres recibir el dinero de tus ventas. Sin ella, Subasti no puede pagarte.',
        method: 'Método de pago',
        bank: 'Transferencia bancaria (IBAN)',
        sinpe: 'SINPE Móvil',
        holderName: 'Nombre del titular',
        holderHelp: 'Debe coincidir con tu nombre verificado',
        bankName: 'Nombre del banco',
        iban: 'Número de cuenta IBAN',
        ibanHelp: 'IBAN costarricense, ej. CR05015202001026284066',
        sinpePhone: 'Número de teléfono SINPE Móvil',
        add: 'Agregar cuenta',
        save: 'Guardar cuenta',
        saving: 'Guardando…',
        edit: 'Cambiar',
        cancel: 'Cancelar',
        remove: 'Eliminar',
        confirmRemove: '¿Eliminar tu cuenta para recibir pagos? Tendrás que agregar una de nuevo para que te paguen.',
        loading: 'Cargando…',
        errors: {
            INVALID_HOLDER_NAME: 'Ingresa el nombre del titular.',
            INVALID_BANK_NAME: 'Ingresa el nombre del banco.',
            INVALID_IBAN: 'Ese IBAN no es válido. Revísalo e intenta de nuevo (22 caracteres, empieza con CR).',
            INVALID_SINPE_PHONE: 'Ingresa un número de 8 dígitos.',
            REQUEST_FAILED: 'No se pudo guardar. Intenta de nuevo.',
        },
    };

    useEffect(() => {
        let cancelled = false;
        payoutApi.fetchPayoutAccount()
            .then((a) => { if (!cancelled) setAccount(a); })
            .catch(() => { if (!cancelled) setAccount(null); });
        return () => { cancelled = true; };
    }, []);

    const startEditing = () => {
        setError('');
        setForm(account
            ? { method: account.method, holderName: account.holderName, bankName: account.bankName, iban: account.iban, sinpePhone: account.sinpePhone }
            : { method: 'bank', holderName: realName || '', bankName: '', iban: '', sinpePhone: '' });
        setEditing(true);
    };

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const saved = await payoutApi.savePayoutAccount(form);
            setAccount(saved);
            setEditing(false);
        } catch (err) {
            setError(L.errors[err.message] || L.errors.REQUEST_FAILED);
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async () => {
        if (!window.confirm(L.confirmRemove)) return;
        try {
            await payoutApi.removePayoutAccount();
            setAccount(null);
        } catch {
            setError(L.errors.REQUEST_FAILED);
        }
    };

    if (account === undefined) {
        return (
            <div className="seller-section">
                <h4>{L.title}</h4>
                <p className="text-sm text-gray-500">{L.loading}</p>
            </div>
        );
    }

    return (
        <div className="seller-section" id="payout-account">
            <h4>{L.title}</h4>
            <p className="text-sm text-gray-600 mb-2">{L.intro}</p>

            {!account && !editing && (
                <div className="seller-notice seller-notice--warn">
                    {L.missing}{' '}
                    <button type="button" onClick={startEditing} className="underline font-semibold">{L.add}</button>
                </div>
            )}

            {account && !editing && (
                <div className="border rounded-lg p-3 text-sm">
                    <p className="font-semibold text-gray-800">
                        {account.method === 'bank' ? L.bank : L.sinpe}
                    </p>
                    <p className="text-gray-700">{account.holderName}</p>
                    {account.method === 'bank' ? (
                        <>
                            <p className="text-gray-600">{account.bankName}</p>
                            <p className="text-gray-600 font-mono whitespace-nowrap">{maskIban(account.iban)}</p>
                        </>
                    ) : (
                        <p className="text-gray-600 font-mono">{account.sinpePhone}</p>
                    )}
                    <div className="flex gap-4 mt-2">
                        <button type="button" onClick={startEditing} className="buyer-order-link-btn">{L.edit}</button>
                        <button type="button" onClick={handleRemove} className="buyer-order-link-btn">{L.remove}</button>
                    </div>
                </div>
            )}

            {editing && (
                <form onSubmit={handleSave} className="border rounded-lg p-4 space-y-3 text-sm">
                    <div>
                        <label className="block font-semibold text-gray-700 mb-1">{L.method}</label>
                        <select value={form.method} onChange={set('method')} className="seller-input w-full">
                            <option value="bank">{L.bank}</option>
                            <option value="sinpe">{L.sinpe}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block font-semibold text-gray-700 mb-1">{L.holderName}</label>
                        <input type="text" value={form.holderName} onChange={set('holderName')} className="seller-input w-full" maxLength={100} required />
                        <p className="text-xs text-gray-500 mt-1">{L.holderHelp}</p>
                    </div>
                    {form.method === 'bank' ? (
                        <>
                            <div>
                                <label className="block font-semibold text-gray-700 mb-1">{L.bankName}</label>
                                <input type="text" value={form.bankName} onChange={set('bankName')} className="seller-input w-full" maxLength={80} required />
                            </div>
                            <div>
                                <label className="block font-semibold text-gray-700 mb-1">{L.iban}</label>
                                <input type="text" value={form.iban} onChange={set('iban')} className="seller-input w-full font-mono" maxLength={30} autoComplete="off" required />
                                <p className="text-xs text-gray-500 mt-1">{L.ibanHelp}</p>
                            </div>
                        </>
                    ) : (
                        <div>
                            <label className="block font-semibold text-gray-700 mb-1">{L.sinpePhone}</label>
                            <input type="tel" value={form.sinpePhone} onChange={set('sinpePhone')} className="seller-input w-full font-mono" maxLength={20} required />
                        </div>
                    )}
                    {error && <p className="text-red-600">{error}</p>}
                    <div className="flex gap-3">
                        <button type="submit" disabled={saving} className="seller-action-btn">{saving ? L.saving : L.save}</button>
                        <button type="button" onClick={() => setEditing(false)} className="buyer-order-link-btn">{L.cancel}</button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default PayoutAccountSection;
