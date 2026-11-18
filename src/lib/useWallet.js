import { useState, useEffect, useCallback } from 'react';
import * as walletApi from '../api/wallet';

const EMPTY_PAYMENTS = { cards: [], sinpe: [], defaultPayment: null, cardsAvailable: true };

// Loads the signed-in buyer's saved addresses and payment methods, and keeps
// them in sync as they change. `setAddresses` / `setPayments` let a caller
// that just mutated something (and got the fresh list back) update instantly.
export function useWallet(user) {
    const [addresses, setAddresses] = useState([]);
    const [payments, setPayments] = useState(EMPTY_PAYMENTS);
    const [loading, setLoading] = useState(Boolean(user));
    const [error, setError] = useState(false);

    const userId = user?.id;
    const refresh = useCallback(async () => {
        if (!userId) return;
        try {
            const [a, p] = await Promise.all([walletApi.fetchAddresses(), walletApi.fetchPaymentMethods()]);
            setAddresses(a.addresses || []);
            setPayments({ ...EMPTY_PAYMENTS, ...p });
            setError(false);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { addresses, setAddresses, payments, setPayments, loading, error, refresh };
}
