import React from 'react';
import { escrowPolicySteps } from '../data/escrow.js';

const EscrowPanel = ({ loc, compact = false }) => {
    const steps = escrowPolicySteps(loc);
    const L = loc === 'en' ? {
        title: 'Subasti Secure Escrow',
        subtitle: 'eBay-style protection for buyers and sellers in Costa Rica',
        badge: 'Funds held by Subasti until you are satisfied',
    } : {
        title: 'Depósito en Garantía Subasti',
        subtitle: 'Protección estilo eBay para compradores y vendedores en Costa Rica',
        badge: 'Los fondos los retiene Subasti hasta que usted esté conforme',
    };

    if (compact) {
        return (
            <div className="escrow-panel escrow-panel--compact">
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
