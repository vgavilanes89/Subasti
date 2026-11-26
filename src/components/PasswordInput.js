import React, { useState } from 'react';

// A password field with a show/hide (eye) button. Takes every prop a normal
// <input> does; each field remembers its own shown/hidden state and starts hidden.
const EyeIcon = ({ crossed }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
        {crossed && <path d="M4 4l16 16" />}
    </svg>
);

const PasswordInput = ({ loc, ...inputProps }) => {
    const [visible, setVisible] = useState(false);
    const label = visible
        ? (loc === 'en' ? 'Hide password' : 'Ocultar contraseña')
        : (loc === 'en' ? 'Show password' : 'Mostrar contraseña');

    return (
        <div className="pw-field">
            <input
                {...inputProps}
                type={visible ? 'text' : 'password'}
                // Revealed passwords are plain text fields: stop phones and browsers
                // from "correcting" or capitalising them.
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
            />
            <button
                type="button"
                className="pw-toggle"
                onClick={() => setVisible(v => !v)}
                aria-label={label}
                aria-pressed={visible}
                title={label}
            >
                <EyeIcon crossed={visible} />
            </button>
        </div>
    );
};

export default PasswordInput;
