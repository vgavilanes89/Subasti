import React, { useState, useEffect } from 'react';

const initialsOf = (name) =>
    String(name || '?')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase())
        .join('') || '?';

// Profile picture, or the person's initials on a brand-colored circle when
// they haven't set one (or the image fails to load).
const Avatar = ({ name, src, size = 40, className = '' }) => {
    const [failed, setFailed] = useState(false);
    useEffect(() => { setFailed(false); }, [src]);

    const box = { width: size, height: size, minWidth: size };

    if (src && !failed) {
        return (
            <img
                src={src}
                alt={name || ''}
                onError={() => setFailed(true)}
                style={box}
                className={`rounded-full object-cover bg-gray-200 ${className}`}
            />
        );
    }
    return (
        <span
            aria-hidden="true"
            style={{ ...box, fontSize: Math.max(10, Math.round(size * 0.4)), background: 'var(--brand-navy, #1e3a5f)' }}
            className={`inline-flex items-center justify-center rounded-full text-white font-semibold select-none ${className}`}
        >
            {initialsOf(name)}
        </span>
    );
};

export default Avatar;
