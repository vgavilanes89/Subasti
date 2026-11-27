/**
 * Vercel serverless: lookup Costa Rican cédula via Verifik.
 * Requires env: VERIFIK_API_KEY
 *
 * A lookup costs money and reveals a person's name, so it is guarded:
 *   - bot check (Cloudflare Turnstile), on when TURNSTILE_SITE_KEY and
 *     TURNSTILE_SECRET_KEY are both set. GET ?config=1 tells the page the site key.
 *   - limits counted in the database: per visitor (hour and day) and overall (day)
 *   - numbers that already have an account are answered without a paid lookup
 */
import { createRateLimiter, getClientIp } from './_lib/rateLimit.js';
import { createCedulaToken } from './_lib/cedulaToken.js';
import { getSql } from './_lib/db.js';
import { countHit, fingerprint } from './_lib/dbRateLimit.js';

const RATE_LIMIT = 5; // requests
const RATE_WINDOW_MS = 60 * 1000;
const isRateLimited = createRateLimiter(RATE_LIMIT, RATE_WINDOW_MS);

// Shared across instances (database).
const PER_VISITOR_HOUR = 5;
const PER_VISITOR_DAY = 15;
const EVERYONE_DAY = 200; // caps what a day of abuse can cost
const HOUR = 60 * 60;
const DAY = 24 * HOUR;

const botCheckOn = () => Boolean(process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);

async function passedBotCheck(token, ip) {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY, response: token, remoteip: ip }).toString(),
  });
  if (!res.ok) throw new Error(`Turnstile answered ${res.status}`);
  return Boolean((await res.json()).success);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // The page asks whether to show the bot check (the site key is public).
  if (req.query.config) {
    return res.status(200).json({ turnstileSiteKey: botCheckOn() ? process.env.TURNSTILE_SITE_KEY : null });
  }

  const clientIp = getClientIp(req);
  if (isRateLimited(clientIp)) {
    res.setHeader('Retry-After', String(RATE_WINDOW_MS / 1000));
    return res.status(429).json({ error: 'Too many requests, please try again shortly' });
  }

  const raw = typeof req.query.cedula === 'string' ? req.query.cedula : '';
  const documentNumber = raw.replace(/[\s-]/g, '');

  if (!/^\d{9,12}$/.test(documentNumber)) {
    return res.status(400).json({ error: 'Invalid cédula format' });
  }

  if (botCheckOn()) {
    const token = typeof req.headers['x-turnstile-token'] === 'string' ? req.headers['x-turnstile-token'] : '';
    try {
      if (!token || !(await passedBotCheck(token, clientIp))) {
        return res.status(403).json({ error: 'bot_check_failed' });
      }
    } catch (err) {
      console.error('Bot check unavailable:', err.message);
      return res.status(503).json({ error: 'verification_unavailable' });
    }
  }

  const sql = getSql();
  const visitor = fingerprint(clientIp);
  const thisHour = await countHit(sql, `cedula:hour:${visitor}`, HOUR);
  const today = await countHit(sql, `cedula:day:${visitor}`, DAY);
  if ((thisHour !== null && thisHour > PER_VISITOR_HOUR) || (today !== null && today > PER_VISITOR_DAY)) {
    return res.status(429).json({ error: 'lookup_limit' });
  }

  // Already has an account: say so, without paying for (or revealing) a name.
  try {
    const taken = await sql`SELECT 1 FROM users WHERE regexp_replace(cedula, '[^0-9]', '', 'g') = ${documentNumber} LIMIT 1`;
    if (taken[0]) {
      return res.status(409).json({ error: 'already_registered' });
    }
  } catch (err) {
    console.error('Cédula account check failed:', err.message);
  }

  const apiKey = process.env.VERIFIK_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'verification_unavailable' });
  }

  const everyone = await countHit(sql, 'cedula:everyone', DAY);
  if (everyone !== null && everyone > EVERYONE_DAY) {
    console.error('Daily cédula lookup cap reached');
    return res.status(503).json({ error: 'verification_unavailable' });
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
      // 401/402/403 mean our key or account is the problem, not the cédula.
      if ([401, 402, 403].includes(upstream.status)) {
        return res.status(503).json({ error: 'verification_unavailable' });
      }
      return res.status(502).json({ error: 'Lookup failed' });
    }

    const body = await upstream.json();
    const data = body?.data;
    if (!data?.fullName && !data?.firstName) {
      return res.status(404).json({ error: 'not_found' });
    }

    const titleCase = (value) => String(value || '').toLowerCase().split(/\s+/).filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const fullName = titleCase(data.fullName || [data.firstName, data.lastName].filter(Boolean).join(' '));
    if (!fullName) {
      return res.status(404).json({ error: 'not_found' });
    }

    return res.status(200).json({
      fullName,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      // Sign-up requires this proof that the number returned a name.
      verificationToken: createCedulaToken(documentNumber, fullName),
    });
  } catch (err) {
    console.error('Verifik lookup error', err.message);
    return res.status(500).json({ error: 'Lookup failed' });
  }
}
