// In-memory sliding-window limiter, per lambda instance. Not shared across
// regions/instances or cold starts — good enough to blunt scripted abuse
// without standing up Redis; swap for @vercel/kv or @upstash/ratelimit if
// usage grows enough to need a shared, durable limit.
const MAX_TRACKED_KEYS = 5000; // cap memory if scanned by many distinct keys

export function createRateLimiter(limit, windowMs) {
  const hits = new Map(); // key -> timestamps[]

  return function isRateLimited(key) {
    const now = Date.now();
    const windowStart = now - windowMs;
    const timestamps = (hits.get(key) || []).filter((t) => t > windowStart);

    if (timestamps.length >= limit) {
      hits.set(key, timestamps);
      return true;
    }

    timestamps.push(now);
    hits.set(key, timestamps);

    if (hits.size > MAX_TRACKED_KEYS) {
      const oldestKey = hits.keys().next().value;
      hits.delete(oldestKey);
    }

    return false;
  };
}

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}
