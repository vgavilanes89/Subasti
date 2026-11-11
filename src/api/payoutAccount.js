async function parseError(res) {
    try {
        const body = await res.json();
        return body?.error || 'REQUEST_FAILED';
    } catch {
        return 'REQUEST_FAILED';
    }
}

export const fetchPayoutAccount = async () => {
    const res = await fetch('/api/account/payout-account');
    if (!res.ok) throw new Error(await parseError(res));
    return res.json();
};

export const savePayoutAccount = async (account) => {
    const res = await fetch('/api/account/payout-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
    });
    if (!res.ok) throw new Error(await parseError(res));
    return res.json();
};

export const removePayoutAccount = async () => {
    const res = await fetch('/api/account/payout-account', { method: 'DELETE' });
    if (!res.ok) throw new Error(await parseError(res));
};
