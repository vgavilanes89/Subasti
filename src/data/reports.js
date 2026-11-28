// Why someone can report a listing or an account. Shared with the server, which
// accepts only these.
export const REPORT_REASONS = {
    item: [
        { id: 'prohibited', en: 'Prohibited or illegal item', es: 'Artículo prohibido o ilegal' },
        { id: 'counterfeit', en: 'Fake or counterfeit', es: 'Falso o falsificado' },
        { id: 'misleading', en: 'Misleading photos or description', es: 'Fotos o descripción engañosas' },
        { id: 'scam', en: 'Scam, or asks to pay outside Subasti', es: 'Estafa, o pide pagar fuera de Subasti' },
        { id: 'offensive', en: 'Offensive content', es: 'Contenido ofensivo' },
        { id: 'other', en: 'Something else', es: 'Otro motivo' },
    ],
    user: [
        { id: 'scam', en: 'Scam, or asked to pay outside Subasti', es: 'Estafa, o pidió pagar fuera de Subasti' },
        { id: 'abuse', en: 'Harassment or abusive messages', es: 'Acoso o mensajes abusivos' },
        { id: 'impersonation', en: 'Pretending to be someone else', es: 'Se hace pasar por otra persona' },
        { id: 'no_deal', en: 'Did not pay or did not deliver', es: 'No pagó o no entregó' },
        { id: 'other', en: 'Something else', es: 'Otro motivo' },
    ],
};

export const REPORT_DETAILS_MAX = 1000;

export const reportReasonLabel = (type, id, loc) => {
    const reason = (REPORT_REASONS[type] || []).find((r) => r.id === id);
    return reason ? reason[loc === 'en' ? 'en' : 'es'] : id;
};
