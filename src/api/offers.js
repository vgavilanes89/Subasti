// Second-chance offers (see api/offers.js).
async function parse(res) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'REQUEST_FAILED');
    return data;
}

export const fetchOffers = async (role) => parse(await fetch(`/api/offers?role=${role}`));

export const postOffer = async (body) => parse(await fetch('/api/offers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
}));
