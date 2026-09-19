// Strips accents so "camara" matches "Cámara" — most users don't type them.
export const normalizeSearch = (text) =>
    String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
