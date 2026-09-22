async function parseErrorMessage(res, fallback) {
    try {
        const body = await res.json();
        return body?.error || fallback;
    } catch {
        return fallback;
    }
}

export const updateProfile = async ({ profileName, phone }) => {
    const res = await fetch('/api/account/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileName, phone }),
    });
    if (!res.ok) throw new Error(await parseErrorMessage(res, 'Could not update profile'));
    return res.json();
};

export const fetchRecentlyViewed = async () => {
    const res = await fetch('/api/account/recently-viewed');
    if (!res.ok) throw new Error('Could not load recently viewed items');
    return res.json();
};
