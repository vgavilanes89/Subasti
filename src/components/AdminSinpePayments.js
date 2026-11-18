import React, { useState, useEffect, useCallback } from 'react';
import { formatMoneyTotals } from './Shared';
import { formatSinpePhone } from '../lib/walletFormat';

// Admin: verify SINPE Móvil payments. Buyers transfer to Subasti's own number
// with a payment reference and then report it; the admin checks the money is
// really in the account and confirms. Confirming is what puts the order in
// escrow and tells the seller to ship.
const AdminSinpePayments = ({ loc }) => {
    const [number, setNumber] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [numberInput, setNumberInput] = useState('');
    const [savingNumber, setSavingNumber] = useState(false);
    const [busyRef, setBusyRef] = useState(null);

    const L = loc === 'en' ? {
        title: 'SINPE Móvil payments',
        intro: 'Buyers transfer to the number below with a payment reference. Check that the money arrived in the account, then confirm. Confirming puts the order in escrow and tells the seller to ship.',
        numberHeading: "Subasti's SINPE Móvil number",
        numberHelp: 'The number buyers send their transfer to. SINPE checkout stays switched off until this is set.',
        numberMissing: 'Not set — buyers cannot pay with SINPE Móvil yet.',
        saveNumber: 'Save number',
        saving: 'Saving…',
        waiting: 'Reported by the buyer — check the account',
        notReported: 'Not reported yet (buyer has not said they paid)',
        none: 'No SINPE payments are waiting.',
        reference: 'Reference',
        buyer: 'Buyer',
        payingFrom: 'Paying from',
        total: 'Amount to look for',
        reportedAt: 'Reported',
        placedAt: 'Order placed',
        items: 'Items',
        confirm: 'Confirm payment received',
        reject: 'Not received',
        working: 'Working…',
        confirmPrompt: (ref, total) => `Confirm that ${total} arrived with reference ${ref}? The orders will move to escrow and the seller(s) will be told to ship.`,
        rejectPrompt: 'Why can you not confirm it? (optional — the buyer will see this)',
        loadError: 'Could not load SINPE payments.',
        actionError: 'That did not work. Please try again.',
        invalidNumber: 'Enter an 8-digit phone number.',
    } : {
        title: 'Pagos SINPE Móvil',
        intro: 'Los compradores transfieren al número de abajo con una referencia de pago. Verifica que el dinero llegó a la cuenta y confirma. Al confirmar, el pedido pasa a depósito y se le avisa al vendedor que envíe.',
        numberHeading: 'Número de SINPE Móvil de Subasti',
        numberHelp: 'El número al que los compradores envían su transferencia. El pago con SINPE queda desactivado hasta que se configure.',
        numberMissing: 'Sin configurar — los compradores aún no pueden pagar con SINPE Móvil.',
        saveNumber: 'Guardar número',
        saving: 'Guardando…',
        waiting: 'Reportado por el comprador — revisa la cuenta',
        notReported: 'Aún no reportado (el comprador no ha dicho que pagó)',
        none: 'No hay pagos SINPE pendientes.',
        reference: 'Referencia',
        buyer: 'Comprador',
        payingFrom: 'Paga desde',
        total: 'Monto a buscar',
        reportedAt: 'Reportado',
        placedAt: 'Pedido hecho',
        items: 'Artículos',
        confirm: 'Confirmar pago recibido',
        reject: 'No recibido',
        working: 'Procesando…',
        confirmPrompt: (ref, total) => `¿Confirmas que llegaron ${total} con la referencia ${ref}? Los pedidos pasarán a depósito y se le avisará al vendedor que envíe.`,
        rejectPrompt: '¿Por qué no puedes confirmarlo? (opcional — el comprador lo verá)',
        loadError: 'No se pudieron cargar los pagos SINPE.',
        actionError: 'Eso no funcionó. Inténtalo de nuevo.',
        invalidNumber: 'Escribe un número de 8 dígitos.',
    };

    const apply = (data) => {
        if (data.number !== undefined) {
            setNumber(data.number);
            setNumberInput(data.number || '');
        }
        if (data.payments) setPayments(data.payments);
    };

    const load = useCallback(async () => {
        setError('');
        try {
            const res = await fetch('/api/admin/sinpe-payments');
            if (!res.ok) throw new Error('LOAD_FAILED');
            apply(await res.json());
        } catch {
            setError(L.loadError);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { load(); }, [load]);

    const post = async (body) => {
        const res = await fetch('/api/admin/sinpe-payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'REQUEST_FAILED');
        return data;
    };

    const handleSaveNumber = async (e) => {
        e.preventDefault();
        setSavingNumber(true);
        setError('');
        try {
            apply(await post({ action: 'setNumber', number: numberInput }));
        } catch (err) {
            setError(err.message === 'INVALID_SINPE_PHONE' ? L.invalidNumber : L.actionError);
        } finally {
            setSavingNumber(false);
        }
    };

    const handleConfirm = async (p) => {
        if (!window.confirm(L.confirmPrompt(p.reference, formatMoneyTotals(p.totals, loc)))) return;
        setBusyRef(p.reference);
        setError('');
        try {
            apply(await post({ action: 'confirm', reference: p.reference }));
        } catch {
            setError(L.actionError);
            load();
        } finally {
            setBusyRef(null);
        }
    };

    const handleReject = async (p) => {
        const note = window.prompt(L.rejectPrompt, '');
        if (note === null) return; // cancelled
        setBusyRef(p.reference);
        setError('');
        try {
            apply(await post({ action: 'reject', reference: p.reference, note }));
        } catch {
            setError(L.actionError);
            load();
        } finally {
            setBusyRef(null);
        }
    };

    const fmt = (ts) => (ts ? new Date(ts).toLocaleString(loc === 'en' ? 'en-US' : 'es-CR') : '—');
    const reported = payments.filter(p => p.reportedAt);
    const notReported = payments.filter(p => !p.reportedAt);

    const renderCard = (p) => (
        <div key={p.reference} className="border rounded-lg p-4 text-sm space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-lg font-bold font-mono text-purple-700">{p.reference}</p>
                <p className="text-lg font-bold text-gray-800">{L.total}: {formatMoneyTotals(p.totals, loc)}</p>
            </div>
            <p className="text-gray-700">
                <strong>{L.buyer}:</strong> {p.buyerName}{p.buyerRealName ? ` (${p.buyerRealName})` : ''}{p.buyerEmail ? ` · ${p.buyerEmail}` : ''}
            </p>
            <p className="text-gray-700"><strong>{L.payingFrom}:</strong> <span className="font-mono">{p.sinpePhone ? formatSinpePhone(p.sinpePhone) : '—'}</span></p>
            <p className="text-gray-500 text-xs">
                {p.reportedAt ? `${L.reportedAt}: ${fmt(p.reportedAt)} · ` : ''}{L.placedAt}: {fmt(p.createdAt)}
            </p>
            <div>
                <p className="font-semibold text-gray-700">{L.items}</p>
                <ul className="list-disc list-inside text-gray-600">
                    {p.orders.map(o => <li key={o.id}>{o.itemTitle}</li>)}
                </ul>
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
                <button type="button" disabled={busyRef === p.reference} onClick={() => handleConfirm(p)} className="seller-action-btn">
                    {busyRef === p.reference ? L.working : L.confirm}
                </button>
                {p.reportedAt && (
                    <button type="button" disabled={busyRef === p.reference} onClick={() => handleReject(p)} className="buyer-order-link-btn">
                        {L.reject}
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border space-y-5">
            <div>
                <h2 className="text-2xl font-bold mb-1">{L.title}</h2>
                <p className="text-sm text-gray-600">{L.intro}</p>
            </div>

            <form onSubmit={handleSaveNumber} className="border rounded-lg p-4 space-y-2 text-sm">
                <label className="block font-semibold text-gray-700">{L.numberHeading}</label>
                <div className="flex flex-wrap gap-2 items-center">
                    <input
                        type="tel"
                        value={numberInput}
                        onChange={(e) => setNumberInput(e.target.value)}
                        placeholder="8888-8888"
                        maxLength={12}
                        className="seller-input font-mono"
                    />
                    <button type="submit" disabled={savingNumber} className="seller-action-btn">{savingNumber ? L.saving : L.saveNumber}</button>
                </div>
                <p className="text-xs text-gray-500">{L.numberHelp}</p>
                {!number && !loading && <p className="seller-notice seller-notice--warn">{L.numberMissing}</p>}
            </form>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {loading ? (
                <p className="text-sm text-gray-500">…</p>
            ) : payments.length === 0 ? (
                <p className="text-sm text-gray-500">{L.none}</p>
            ) : (
                <>
                    {reported.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="font-bold text-gray-800">{L.waiting} ({reported.length})</h3>
                            {reported.map(renderCard)}
                        </div>
                    )}
                    {notReported.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="font-bold text-gray-500">{L.notReported} ({notReported.length})</h3>
                            {notReported.map(renderCard)}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminSinpePayments;
