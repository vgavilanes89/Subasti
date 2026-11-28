// How worn a used item is, as the seller grades it on the Sell form.
export const USED_CONDITIONS = ['like_new', 'good', 'fair', 'parts_only'];

const LABELS = {
    like_new: { en: 'Like New', es: 'Como Nuevo' },
    good: { en: 'Good', es: 'Bueno' },
    fair: { en: 'Fair', es: 'Aceptable' },
    parts_only: { en: 'Parts Only', es: 'Solo Partes' },
};

// '' when no grade was recorded (listings published before it was saved).
export const usedConditionLabel = (value, loc) => LABELS[value]?.[loc === 'en' ? 'en' : 'es'] || '';
