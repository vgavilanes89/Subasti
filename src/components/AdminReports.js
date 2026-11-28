import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportReasonLabel } from '../data/reports';

// Admin: listings and accounts people have reported, one card per thing.
const AdminReports = ({ loc, onChanged, onMessage }) => {
    const navigate = useNavigate();
    const [status, setStatus] = useState('open');
    const [groups, setGroups] = useState(null);
    const [busy, setBusy] = useState('');
    const [error, setError] = useState('');

    const L = loc === 'en' ? {
        title: 'Reports',
        intro: 'Listings and accounts people have flagged. Suspending an account blocks its sign-in; its listings stay up, so hide those too if needed.',
        open: 'To review',
        closed: 'Closed',
        loading: 'Loading…',
        noneOpen: 'Nothing to review.',
        noneClosed: 'No closed reports yet.',
        item: 'Listing',
        user: 'Account',
        by: 'Seller',
        count: (n) => `${n} ${n === 1 ? 'report' : 'reports'}`,
        reportedBy: 'Reported by',
        gone: 'No longer listed',
        suspended: 'Suspended',
        hide: 'Hide listing',
        suspend: 'Suspend account',
        resolve: 'Mark handled',
        dismiss: 'Dismiss',
        message: 'Message them',
        confirm: {
            hide_item: 'Hide this listing from the site and tell the seller?',
            suspend_user: 'Suspend this account? It will no longer be able to sign in.',
            resolve: 'Close these reports as handled?',
            dismiss: 'Dismiss these reports with no action?',
        },
        failed: 'Could not do that. Reload and try again.',
        state: { resolved: 'Handled', dismissed: 'Dismissed' },
    } : {
        title: 'Reportes',
        intro: 'Publicaciones y cuentas que las personas han señalado. Suspender una cuenta impide iniciar sesión; sus publicaciones siguen visibles, así que ocúltalas también si hace falta.',
        open: 'Por revisar',
        closed: 'Cerrados',
        loading: 'Cargando…',
        noneOpen: 'No hay nada por revisar.',
        noneClosed: 'Aún no hay reportes cerrados.',
        item: 'Publicación',
        user: 'Cuenta',
        by: 'Vendedor',
        count: (n) => `${n} ${n === 1 ? 'reporte' : 'reportes'}`,
        reportedBy: 'Reportado por',
        gone: 'Ya no está publicada',
        suspended: 'Suspendida',
        hide: 'Ocultar publicación',
        suspend: 'Suspender cuenta',
        resolve: 'Marcar atendido',
        dismiss: 'Descartar',
        message: 'Enviar mensaje',
        confirm: {
            hide_item: '¿Ocultar esta publicación del sitio y avisar al vendedor?',
            suspend_user: '¿Suspender esta cuenta? Ya no podrá iniciar sesión.',
            resolve: '¿Cerrar estos reportes como atendidos?',
            dismiss: '¿Descartar estos reportes sin tomar medidas?',
        },
        failed: 'No se pudo hacer. Recarga e intenta de nuevo.',
        state: { resolved: 'Atendido', dismissed: 'Descartado' },
    };

    const load = useCallback(() => {
        setError('');
        fetch(`/api/reports?status=${status}`)
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error('LOAD_FAILED'))))
            .then((data) => setGroups(data.groups))
            .catch(() => { setGroups([]); setError('LOAD_FAILED'); });
    }, [status]);

    useEffect(() => { setGroups(null); load(); }, [load]);

    const act = async (group, action) => {
        if (!window.confirm(L.confirm[action])) return;
        setBusy(`${group.targetType}:${group.targetId}`);
        setError('');
        try {
            const res = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, targetType: group.targetType, targetId: group.targetId }),
            });
            if (!res.ok) throw new Error('FAILED');
            load();
            onChanged(action);
        } catch {
            setError('FAILED');
        } finally {
            setBusy('');
        }
    };

    const date = (ts) => new Date(ts).toLocaleString(loc === 'en' ? 'en-US' : 'es-CR', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

    return (
        <div className="seller-section">
            <h4>{L.title}</h4>
            <p className="text-sm text-gray-500 mb-3">{L.intro}</p>
            <div className="flex gap-2 mb-4">
                {['open', 'closed'].map((s) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        aria-pressed={status === s}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${status === s ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                        {L[s]}
                    </button>
                ))}
            </div>
            {error && <p className="text-sm text-red-600 mb-3" role="alert">{L.failed}</p>}
            {groups === null && <p className="text-sm text-gray-500">{L.loading}</p>}
            {groups?.length === 0 && !error && <p className="text-sm text-gray-500">{status === 'open' ? L.noneOpen : L.noneClosed}</p>}

            <div className="seller-orders-list">
                {groups?.map((g) => {
                    const key = `${g.targetType}:${g.targetId}`;
                    const path = g.targetType === 'item' ? `/item/${g.targetId}` : `/seller/${g.targetId}`;
                    return (
                        <div key={key} className="seller-order-card">
                            <div className="seller-order-info min-w-0 flex-1">
                                <p className="flex flex-wrap items-center gap-2">
                                    <span className="seller-badge">{L[g.targetType]}</span>
                                    {g.itemGone
                                        ? <span className="font-semibold text-gray-800">{g.label}</span>
                                        : <button type="button" className="buyer-profile-link" onClick={() => navigate(path)}>{g.label}</button>}
                                    <span className="seller-badge seller-badge--danger">{L.count(g.reports.length)}</span>
                                    {g.itemGone && <span className="seller-badge">{L.gone}</span>}
                                    {g.ownerSuspended && <span className="seller-badge seller-badge--warn">{L.suspended}</span>}
                                </p>
                                {g.targetType === 'item' && (
                                    <p className="text-sm text-gray-600">
                                        {L.by}: <button type="button" className="buyer-profile-link" onClick={() => navigate(`/seller/${g.ownerId}`)}>{g.ownerName}</button>
                                    </p>
                                )}
                                <ul className="mt-2 space-y-2">
                                    {g.reports.map((r) => (
                                        <li key={r.id} className="text-sm border-l-2 border-gray-200 pl-3">
                                            <p className="font-semibold text-gray-800">
                                                {reportReasonLabel(g.targetType, r.reason, loc)}
                                                {r.status !== 'open' && <span className="font-normal text-gray-500"> · {L.state[r.status]}</span>}
                                            </p>
                                            {r.details && <p className="text-gray-700 break-words">{r.details}</p>}
                                            <p className="text-xs text-gray-500">
                                                {L.reportedBy} <button type="button" className="buyer-profile-link" onClick={() => navigate(`/seller/${r.reporterId}`)}>{r.reporterName}</button> · {date(r.createdAt)}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {status === 'open' && (
                                <div className="seller-order-actions">
                                    {g.targetType === 'item' && !g.itemGone && (
                                        <button type="button" className="seller-action-btn" disabled={busy === key} onClick={() => act(g, 'hide_item')}>{L.hide}</button>
                                    )}
                                    {!g.ownerSuspended && !g.ownerIsAdmin && (
                                        <button type="button" className="seller-action-btn seller-action-btn--secondary" disabled={busy === key} onClick={() => act(g, 'suspend_user')}>{L.suspend}</button>
                                    )}
                                    <button type="button" className="buyer-order-link-btn" onClick={() => onMessage(g.ownerId)}>{L.message}</button>
                                    <button type="button" className="buyer-order-link-btn" disabled={busy === key} onClick={() => act(g, 'resolve')}>{L.resolve}</button>
                                    <button type="button" className="buyer-order-link-btn" disabled={busy === key} onClick={() => act(g, 'dismiss')}>{L.dismiss}</button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AdminReports;
