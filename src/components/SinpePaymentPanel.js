import React, { useEffect, useRef, useState } from 'react';
import { formatMoneyTotals } from './Shared';
import { getSinpeInstructions, reportSinpePayment } from '../api/orders';
import { formatSinpePhone } from '../lib/walletFormat';

// How a buyer pays by SINPE Móvil: transfer the total to Subasti's number with
// the payment reference as the description, then say so. An admin confirms the
// money arrived — only then is the order paid and held in escrow.
//   target: { orderId } (one order) or { reference } (a whole checkout)
const SinpePaymentPanel = ({ loc, target, defaultPhone = '', savedNumbers = [], onReported, onClose, closeLabel }) => {
    const [info, setInfo] = useState(null);
    const [error, setError] = useState('');
    const [phone, setPhone] = useState(defaultPhone);
    const [reporting, setReporting] = useState(false);
    const [copied, setCopied] = useState('');
    const loaded = useRef(false);

    const L = loc === 'en' ? {
        title: 'Pay with SINPE Móvil',
        loading: 'Preparing your payment details…',
        step1: 'Open SINPE Móvil and send exactly',
        step1b: 'to this number:',
        step2: 'In the transfer description, write this reference:',
        step3: 'Then press the button below. Subasti checks that the money arrived; once confirmed, your payment is held in escrow and the seller ships your order.',
        notPaid: 'Your order is not paid until Subasti confirms the transfer.',
        yourNumber: 'The SINPE Móvil number you are paying from',
        report: "I've made the transfer",
        reporting: 'Sending…',
        copy: 'Copy',
        copied: 'Copied',
        reportedTitle: 'Thanks — we are verifying your transfer',
        reportedText: 'You will get a notification as soon as Subasti confirms it. If the reference or amount does not match, we will let you know.',
        close: 'Close',
        errors: {
            SINPE_UNAVAILABLE: 'SINPE Móvil is not available right now. Please pay by card or try again later.',
            SINPE_PHONE_REQUIRED: 'Enter the 8-digit SINPE Móvil number you paid from.',
            NOT_PAYABLE: 'This order can no longer be paid.',
            PAYMENT_METHOD_NOT_ACCEPTED: 'The seller does not accept SINPE Móvil for this item.',
            REQUEST_FAILED: 'Something went wrong. Please try again.',
        },
    } : {
        title: 'Pagar con SINPE Móvil',
        loading: 'Preparando los datos de tu pago…',
        step1: 'Abre SINPE Móvil y envía exactamente',
        step1b: 'a este número:',
        step2: 'En la descripción de la transferencia escribe esta referencia:',
        step3: 'Luego presiona el botón de abajo. Subasti verifica que el dinero llegó; al confirmarlo, tu pago queda en depósito y el vendedor envía tu pedido.',
        notPaid: 'Tu pedido no se considera pagado hasta que Subasti confirme la transferencia.',
        yourNumber: 'El número de SINPE Móvil desde el que pagas',
        report: 'Ya hice la transferencia',
        reporting: 'Enviando…',
        copy: 'Copiar',
        copied: 'Copiado',
        reportedTitle: 'Gracias — estamos verificando tu transferencia',
        reportedText: 'Recibirás una notificación apenas Subasti la confirme. Si la referencia o el monto no coinciden, te avisaremos.',
        close: 'Cerrar',
        errors: {
            SINPE_UNAVAILABLE: 'SINPE Móvil no está disponible por ahora. Paga con tarjeta o inténtalo más tarde.',
            SINPE_PHONE_REQUIRED: 'Escribe el número de SINPE Móvil de 8 dígitos desde el que pagaste.',
            NOT_PAYABLE: 'Este pedido ya no se puede pagar.',
            PAYMENT_METHOD_NOT_ACCEPTED: 'El vendedor no acepta SINPE Móvil para este artículo.',
            REQUEST_FAILED: 'Algo salió mal. Inténtalo de nuevo.',
        },
    };

    useEffect(() => {
        // Once per mount (immune to StrictMode's double effect) — preparing an
        // order twice is harmless but wasteful.
        if (loaded.current) return;
        loaded.current = true;
        getSinpeInstructions(target)
            .then(setInfo)
            .catch((err) => setError(L.errors[err.message] || L.errors.REQUEST_FAILED));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const copy = async (text, key) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(key);
            setTimeout(() => setCopied(''), 1500);
        } catch {
            // clipboard blocked — the value is on screen to copy by hand
        }
    };

    const handleReport = async () => {
        setReporting(true);
        setError('');
        try {
            const summary = await reportSinpePayment(target, phone.replace(/\D/g, ''));
            setInfo(summary);
            onReported?.(summary);
        } catch (err) {
            setError(L.errors[err.message] || L.errors.REQUEST_FAILED);
        } finally {
            setReporting(false);
        }
    };

    if (!info && !error) return <p className="text-sm text-gray-500">{L.loading}</p>;
    if (!info) {
        return (
            <div className="space-y-3">
                <p className="text-sm text-red-600">{error}</p>
                <button type="button" onClick={onClose} className="py-2 px-4 rounded-lg border font-semibold text-gray-600">{closeLabel || L.close}</button>
            </div>
        );
    }

    const total = formatMoneyTotals(info.totals, loc);
    const digits = phone.replace(/\D/g, '');

    return (
        <div className="space-y-4">
            <h4 className="font-bold text-gray-800">{L.title}</h4>

            <div className="bg-gray-50 p-4 rounded-lg space-y-3 text-sm">
                <p className="text-gray-700">{L.step1} <strong className="text-lg">{total}</strong> {L.step1b}</p>
                <div className="flex items-center justify-between gap-2">
                    <span className="text-2xl font-bold text-gray-800 font-mono">{formatSinpePhone(info.number)}</span>
                    <button type="button" onClick={() => copy(info.number, 'number')} className="buyer-order-link-btn">{copied === 'number' ? L.copied : L.copy}</button>
                </div>
                <p className="text-gray-700">{L.step2}</p>
                <div className="flex items-center justify-between gap-2">
                    <span className="text-2xl font-bold text-purple-700 font-mono tracking-wide">{info.reference}</span>
                    <button type="button" onClick={() => copy(info.reference, 'ref')} className="buyer-order-link-btn">{copied === 'ref' ? L.copied : L.copy}</button>
                </div>
            </div>

            {info.reported ? (
                <div className="seller-notice seller-notice--ok text-sm">
                    <strong>{L.reportedTitle}</strong>
                    <p className="mt-1">{L.reportedText}</p>
                </div>
            ) : (
                <>
                    <p className="text-sm text-gray-600">{L.step3}</p>
                    <p className="text-xs text-gray-500">{L.notPaid}</p>
                    <div className="text-left">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">{L.yourNumber}</label>
                        {savedNumbers.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                                {savedNumbers.map(n => (
                                    <button
                                        key={n.id}
                                        type="button"
                                        onClick={() => setPhone(n.phone)}
                                        className={`px-3 py-1 rounded-full border text-sm font-mono ${digits === n.phone ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-300 text-gray-700'}`}
                                    >{formatSinpePhone(n.phone)}</button>
                                ))}
                            </div>
                        )}
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="8888-8888"
                            maxLength={12}
                            className="w-full p-3 border rounded-lg font-mono"
                            autoComplete="tel-national"
                        />
                    </div>
                </>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border font-semibold text-gray-600">{closeLabel || L.close}</button>
                {!info.reported && (
                    <button
                        type="button"
                        onClick={handleReport}
                        disabled={reporting || digits.length !== 8}
                        className="flex-1 py-2 rounded-lg bg-purple-600 text-white font-semibold disabled:opacity-60"
                    >
                        {reporting ? L.reporting : L.report}
                    </button>
                )}
            </div>
        </div>
    );
};

export default SinpePaymentPanel;
