/**
 * Vercel serverless: lookup Costa Rican cédula via Verifik.
 * Requires env: VERIFIK_API_KEY
 */
import { createRateLimiter, getClientIp } from './_lib/rateLimit.js';

const RATE_LIMIT = 5; // requests
const RATE_WINDOW_MS = 60 * 1000;
const isRateLimited = createRateLimiter(RATE_LIMIT, RATE_WINDOW_MS);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = getClientIp(req);
  if (isRateLimited(clientIp)) {
    res.setHeader('Retry-After', String(RATE_WINDOW_MS / 1000));
    return res.status(429).json({ error: 'Too many requests, please try again shortly' });
  }

  const apiKey = process.env.VERIFIK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Cédula lookup is not configured' });
  }

  const raw = typeof req.query.cedula === 'string' ? req.query.cedula : '';
  const documentNumber = raw.replace(/[\s-]/g, '');

  if (!/^\d{9,12}$/.test(documentNumber)) {
    return res.status(400).json({ error: 'Invalid cédula format' });
  }

  try {
    const url = new URL('https://api.verifik.co/v2/cr/cedula');
    url.searchParams.set('documentType', 'CCCR');
    url.searchParams.set('documentNumber', documentNumber);

    const upstream = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (upstream.status === 404) {
      return res.status(404).json({ error: 'not_found' });
    }

    if (!upstream.ok) {
      const upstreamBody = await upstream.text().catch(() => '');
      console.error('Verifik lookup failed', upstream.status, upstreamBody.slice(0, 500));
      return res.status(502).json({ error: 'Lookup failed' });
    }

    const body = await upstream.json();
    const data = body?.data;
    if (!data?.fullName && !data?.firstName) {
      return res.status(404).json({ error: 'not_found' });
    }

    return res.status(200).json({
      fullName: data.fullName || [data.firstName, data.lastName].filter(Boolean).join(' '),
      firstName: data.firstName || '',
      lastName: data.lastName || '',
    });
  } catch (err) {
    console.error('Verifik lookup error', err.message);
    return res.status(500).json({ error: 'Lookup failed' });
  }
}
