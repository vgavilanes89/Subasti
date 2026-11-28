import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { REPORT_REASONS, REPORT_DETAILS_MAX } from '../data/reports';
import { EMAIL_NOT_CONFIRMED, emailNeededText } from '../data/emailConfirm';

// "Report listing" / "Report user": a quiet link that opens a short form.
const ReportButton = ({ targetType, targetId, loc }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [details, setDetails] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    const L = loc === 'en' ? {
        link: targetType === 'item' ? 'Report this listing' : 'Report this user',
        why: 'What is wrong?',
        choose: 'Choose a reason',
        details: 'Details (what happened, and where)',
        private: 'Only Subasti sees your report. The person you report is not told who sent it.',
        send: 'Send report',
        cancel: 'Cancel',
        thanks: 'Thank you. Subasti will review your report.',
        errors: {
            REASON_REQUIRED: 'Choose a reason.',
            DETAILS_REQUIRED: 'Tell us what is wrong.',
            ALREADY_REPORTED: 'You have already reported this. We are looking into it.',
            TOO_MANY_REQUESTS: 'You have sent many reports today. Please use the Contact page.',
            REQUEST_FAILED: 'Could not send your report. Please try again.',
        },
    } : {
        link: targetType === 'item' ? 'Reportar esta publicación' : 'Reportar a este usuario',
        why: '¿Qué está mal?',
        choose: 'Elige un motivo',
        details: 'Detalles (qué pasó y dónde)',
        private: 'Solo Subasti ve tu reporte. A la persona reportada no se le dice quién lo envió.',
        send: 'Enviar reporte',
        cancel: 'Cancelar',
        thanks: 'Gracias. Subasti revisará tu reporte.',
        errors: {
            REASON_REQUIRED: 'Elige un motivo.',
            DETAILS_REQUIRED: 'Cuéntanos qué está mal.',
            ALREADY_REPORTED: 'Ya reportaste esto. Lo estamos revisando.',
            TOO_MANY_REQUESTS: 'Has enviado muchos reportes hoy. Usa la página de Contacto.',
            REQUEST_FAILED: 'No se pudo enviar tu reporte. Intenta de nuevo.',
        },
    };

    if (sent) return <p className="report-thanks" role="status">{L.thanks}</p>;

    if (!open) {
        return (
            <button type="button" className="report-link tap-target" onClick={() => (user ? setOpen(true) : navigate('/login'))}>
                ⚑ {L.link}
            </button>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason) { setError(L.errors.REASON_REQUIRED); return; }
        setSending(true);
        setError('');
        try {
            const res = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetType, targetId, reason, details }),
            });
            if (res.ok) { setSent(true); return; }
            const code = (await res.json().catch(() => ({}))).error;
            setError(code === EMAIL_NOT_CONFIRMED ? emailNeededText(loc) : (L.errors[code] || L.errors.REQUEST_FAILED));
        } catch {
            setError(L.errors.REQUEST_FAILED);
        } finally {
            setSending(false);
        }
    };

    return (
        <form className="report-form" onSubmit={handleSubmit} noValidate>
            <label className="text-sm font-bold text-gray-700">
                {L.why}
                <select value={reason} onChange={(e) => { setReason(e.target.value); setError(''); }} className="seller-input mt-1 block w-full font-normal">
                    <option value="">{L.choose}</option>
                    {REPORT_REASONS[targetType].map((r) => <option key={r.id} value={r.id}>{r[loc === 'en' ? 'en' : 'es']}</option>)}
                </select>
            </label>
            <textarea
                value={details}
                onChange={(e) => { setDetails(e.target.value); setError(''); }}
                placeholder={L.details}
                aria-label={L.details}
                maxLength={REPORT_DETAILS_MAX}
                rows={3}
                className="seller-input"
            />
            <p className="text-xs text-gray-500">{L.private}</p>
            {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
            <div className="flex gap-3 items-center">
                <button type="submit" className="seller-action-btn" disabled={sending}>{sending ? '…' : L.send}</button>
                <button type="button" className="buyer-order-link-btn" onClick={() => setOpen(false)}>{L.cancel}</button>
            </div>
        </form>
    );
};

export default ReportButton;
