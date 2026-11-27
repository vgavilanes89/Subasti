import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

// Cloudflare Turnstile ("are you a bot?"). Usually passes without any click.
// Each token works once, so the parent calls reset() after using it.
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

const loadTurnstile = () => new Promise((resolve, reject) => {
    if (window.turnstile) { resolve(window.turnstile); return; }
    let script = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (!script) {
        script = document.createElement('script');
        script.src = SCRIPT_SRC;
        script.async = true;
        document.head.appendChild(script);
    }
    script.addEventListener('load', () => resolve(window.turnstile));
    script.addEventListener('error', () => reject(new Error('TURNSTILE_BLOCKED')));
});

const TurnstileWidget = forwardRef(({ siteKey, loc, onToken, onError }, ref) => {
    const holder = useRef(null);
    const widgetId = useRef(null);
    // Latest callbacks without re-rendering the widget.
    const callbacks = useRef({ onToken, onError });
    callbacks.current = { onToken, onError };

    useImperativeHandle(ref, () => ({
        reset: () => {
            if (window.turnstile && widgetId.current !== null) window.turnstile.reset(widgetId.current);
        },
    }));

    useEffect(() => {
        let cancelled = false;
        loadTurnstile().then((turnstile) => {
            if (cancelled || !holder.current) return;
            widgetId.current = turnstile.render(holder.current, {
                sitekey: siteKey,
                language: loc === 'en' ? 'en' : 'es',
                callback: (token) => callbacks.current.onToken(token),
                'expired-callback': () => callbacks.current.onToken(''),
                'error-callback': () => callbacks.current.onError(),
            });
        }).catch(() => callbacks.current.onError());
        return () => {
            cancelled = true;
            if (window.turnstile && widgetId.current !== null) {
                window.turnstile.remove(widgetId.current);
                widgetId.current = null;
            }
        };
    }, [siteKey, loc]);

    return <div ref={holder} className="turnstile-holder" />;
});

export default TurnstileWidget;
