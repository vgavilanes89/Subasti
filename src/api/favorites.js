export const fetchFavorites = async () => {
    const res = await fetch('/api/favorites/list');
    if (!res.ok) throw new Error('Could not load favorites');
    return res.json();
};

export const toggleFavorite = async (itemId) => {
    const res = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
    });
    if (!res.ok) throw new Error('Could not update favorite');
    return res.json();
};
