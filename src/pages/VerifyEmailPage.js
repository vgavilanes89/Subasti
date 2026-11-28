import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Where the emailed confirmation link lands.
const VerifyEmailPage = ({ loc }) => {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { refreshUser } = useAuth();
    const token = params.get('token') || '';
    const [state, setState] = useState('working'); // working | done | invalid | failed

    useEffect(() => {
        let cancelled = false;
        fetch('/api/auth/verify-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        })
            .then(async (res) => {
                if (cancelled) return;
                if (res.ok) { setState('done'); refreshUser(); return; }
                setState(res.status === 400 || res.status === 401 ? 'invalid' : 'failed');
            })
            .catch(() => { if (!cancelled) setState('failed'); });
        return () => { cancelled = true; };
    }, [token, refreshUser]);

    const L = loc === 'en' ? {
        working: 'Confirming your email…',
        done: 'Your email is confirmed. You can now bid, buy and sell.',
        invalid: 'This link has expired or is no longer valid. Log in and send a new one from the notice at the top of the page.',
        failed: 'We could not confirm your email just now. Please try the link again in a moment.',
        home: 'Go to Subasti',
    } : {
        working: 'Confirmando tu correo…',
        done: 'Tu correo está confirmado. Ya puedes pujar, comprar y vender.',
        invalid: 'Este enlace venció o ya no es válido. Inicia sesión y pide uno nuevo desde el aviso en la parte de arriba.',
        failed: 'No pudimos confirmar tu correo en este momento. Intenta el enlace de nuevo en un momento.',
        home: 'Ir a Subasti',
    };

    return (
        <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-md border text-center">
            <p className="text-gray-800 text-lg" role="status">{L[state]}</p>
            {state !== 'working' && (
                <button type="button" onClick={() => navigate('/')} className="mt-6 bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                    {L.home}
                </button>
            )}
        </div>
    );
};

export default VerifyEmailPage;
