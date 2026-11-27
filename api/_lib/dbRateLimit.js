import { createHash } from 'crypto';

// Counters kept in the database, so a limit holds across all server instances
// and restarts. Fixed windows: "N per hour", "N per day".

// Returns how many hits this bucket has in the current window, including this
// one — or null if the counter can't be used (e.g. the table isn't there yet),
// so the caller can carry on rather than lock everyone out.
export async function countHit(sql, bucket, windowSeconds) {
  const size = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(Date.now() / size) * size).toISOString();
  try {
    const rows = await sql`
      INSERT INTO rate_limits (bucket, window_start, hits) VALUES (${bucket}, ${windowStart}, 1)
      ON CONFLICT (bucket, window_start) DO UPDATE SET hits = rate_limits.hits + 1
      RETURNING hits
    `;
    // Tidy up old windows now and then.
    if (Math.random() < 0.02) {
      await sql`DELETE FROM rate_limits WHERE window_start < now() - interval '3 days'`;
    }
    return rows[0].hits;
  } catch (err) {
    console.error('Rate limit counter unavailable:', err.message);
    return null;
  }
}

// IP addresses are personal data: store only a keyed fingerprint.
export const fingerprint = (value) =>
  createHash('sha256').update(`${process.env.SESSION_SECRET || ''}:${value}`).digest('hex').slice(0, 24);
