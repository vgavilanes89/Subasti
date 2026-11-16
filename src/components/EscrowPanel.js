import React, { useState } from 'react';
import { escrowPolicySteps } from '../data/escrow.js';

// Closing the panel hides it for the rest of the browser session (sessionStorage:
// survives navigating between pages, reloads and logging in/out, but a brand
// new tab/visit shows it again). The in-memory flag is a fallback for browsers
// where sessionStorage is unavailable (private mode, blocked storage).
const DISMISS_KEY = 'subasti_escrow_panel_dismissed';
let dismissedInMemory = false;

const wasDismissed = () => {
    if (dismissedInMemory) return true;
    try {
        return window.sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
        return false;
    }
};

const rememberDismissed = () => {
    dismissedInMemory = true;
    try {
        window.sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
        // storage unavailable — the in-memory flag still covers this page view
    }
};

const EscrowPanel = ({ loc, compact = false }) => {
    const [dismissed, setDismissed] = useState(wasDismissed);
    const steps = escrowPolicySteps(loc);
    const L = loc === 'en' ? {
        title: 'Subasti Secure Escrow',
        subtitle: 'Secure protection for buyers and sellers in Costa Rica',
        badge: 'Funds held by Subasti until you are satisfied',
        close: 'Close',
    } : {
        title: 'Depósito en Garantía Subasti',
        subtitle: 'Protección segura para compradores y vendedores en Costa Rica',
        badge: 'Los fondos los retiene Subasti hasta que usted esté conforme',
        close: 'Cerrar',
    };

    if (dismissed) return null;

    const closeBtn = (
        <button
            type="button"
            className="escrow-panel-close"
            onClick={() => { rememberDismissed(); setDismissed(true); }}
            aria-label={L.close}
        >
            ×
        </button>
    );

    if (compact) {
        return (
            <div className="escrow-panel escrow-panel--compact">
                {closeBtn}
                <p className="escrow-panel-badge">{L.badge}</p>
                <p className="escrow-panel-compact-text">
                    {loc === 'en'
                        ? 'Payment is secured by Subasti. Sellers ship within 48h. Buyers have 48h after delivery to release funds or file a claim.'
                        : 'El pago queda asegurado por Subasti. Vendedores envían en 48h. Compradores tienen 48h tras la entrega para liberar fondos o reclamar.'}
                </p>
            </div>
        );
    }

    return (
        <div className="escrow-panel">
            {closeBtn}
            <div className="escrow-panel-header">
                <h3>{L.title}</h3>
                <p>{L.subtitle}</p>
                <span className="escrow-panel-badge">{L.badge}</span>
            </div>
            <ol className="escrow-steps">
                {steps.map((step, i) => (
                    <li key={step.title}>
                        <span className="escrow-step-num">{i + 1}</span>
                        <div>
                            <strong>{step.title}</strong>
                            <p>{step.text}</p>
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
};

export default EscrowPanel;
