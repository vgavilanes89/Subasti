async function parseError(res) {
    try {
        const body = await res.json();
        return body?.error || 'REQUEST_FAILED';
    } catch {
        return 'REQUEST_FAILED';
    }
}

export const uploadAvatar = async (blob) => {
    const res = await fetch('/api/account/avatar', {
        method: 'POST',
        headers: { 'Content-Type': blob.type || 'image/jpeg' },
        body: blob,
    });
    if (res.status === 429) throw new Error('TOO_MANY');
    if (!res.ok) throw new Error(await parseError(res));
    return res.json();
};

export const deleteAvatar = async () => {
    const res = await fetch('/api/account/avatar', { method: 'DELETE' });
    if (!res.ok) throw new Error(await parseError(res));
    return res.json();
};
