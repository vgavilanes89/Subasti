import React from 'react';
import { checkPassword, PASSWORD_MIN } from '../lib/passwordPolicy';

// Live "is this password good enough?" list shown under a new-password field.
// Uses the same rules the server enforces (src/lib/passwordPolicy.js).
export const PASSWORD_PROBLEM_TEXT = {
    en: {
        LENGTH: `Use at least ${PASSWORD_MIN} characters.`,
        NEEDS_LETTER_AND_NUMBER: 'Include at least one letter and one number.',
        TOO_COMMON: 'That password is too common or easy to guess. Try a few unrelated words, or a longer phrase.',
        PERSONAL: 'Your password cannot contain your name, email or ID number.',
    },
    es: {
        LENGTH: `Usa al menos ${PASSWORD_MIN} caracteres.`,
        NEEDS_LETTER_AND_NUMBER: 'Incluye al menos una letra y un número.',
        TOO_COMMON: 'Esa contraseña es muy común o fácil de adivinar. Prueba con varias palabras sin relación, o una frase más larga.',
        PERSONAL: 'Tu contraseña no puede contener tu nombre, correo ni cédula.',
    },
};

const PasswordChecklist = ({ password, context, loc }) => {
    const { checks } = checkPassword(password, context);
    const started = password.length > 0;

    const L = loc === 'en' ? {
        length: `At least ${PASSWORD_MIN} characters`,
        mix: 'Includes a letter and a number',
        notCommon: 'Not a common or easily guessed password',
        notPersonal: 'Does not contain your name, email or ID number',
    } : {
        length: `Al menos ${PASSWORD_MIN} caracteres`,
        mix: 'Incluye una letra y un número',
        notCommon: 'No es una contraseña común o fácil de adivinar',
        notPersonal: 'No contiene tu nombre, correo ni cédula',
    };

    const items = [
        ['length', L.length, checks.length],
        ['mix', L.mix, checks.mix],
        ['notCommon', L.notCommon, checks.notCommon && started],
    ];
    // Only worth listing once it has been broken (or when we know who they are).
    if (context && (!checks.notPersonal || started)) items.push(['notPersonal', L.notPersonal, checks.notPersonal && started]);

    return (
        <ul className="pw-checklist" aria-live="polite">
            {items.map(([key, text, ok]) => (
                <li key={key} className={ok ? 'pw-ok' : (started ? 'pw-bad' : '')}>
                    <span aria-hidden>{ok ? '✓' : (started ? '✗' : '•')}</span> {text}
                </li>
            ))}
        </ul>
    );
};

export default PasswordChecklist;
