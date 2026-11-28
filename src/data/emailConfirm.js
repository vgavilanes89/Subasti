// The server refuses some actions with this until the account's email is confirmed.
export const EMAIL_NOT_CONFIRMED = 'EMAIL_NOT_CONFIRMED';

export const emailNeededText = (loc) => (loc === 'en'
    ? 'Confirm your email first. Use the link we sent you, or send it again from the notice at the top of the page.'
    : 'Primero confirma tu correo. Usa el enlace que te enviamos, o pídelo de nuevo desde el aviso en la parte de arriba.');
