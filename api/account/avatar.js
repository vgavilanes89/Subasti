import { put, del } from '@vercel/blob';
import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';
import { createRateLimiter } from '../_lib/rateLimit.js';
import { toPublicUser } from '../_lib/users.js';

// The client sends one small, already-cropped square (a few tens of KB), so
// this stays far below Vercel's request-size limit.
export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_BYTES = 1024 * 1024;
const BLOB_HOST = '.blob.vercel-storage.com';
const isRateLimited = createRateLimiter(10, 60 * 1000);

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > MAX_BYTES) {
        reject(new Error('TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Trust the file's own bytes, not the Content-Type header the client claims.
function detectImageType(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { type: 'image/jpeg', ext: 'jpg' };
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { type: 'image/png', ext: 'png' };
  if (buf.length >= 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return { type: 'image/webp', ext: 'webp' };
  return null;
}

async function deleteBlobQuietly(url) {
  if (typeof url !== 'string' || !url.includes(BLOB_HOST)) return;
  try {
    await del(url);
  } catch (err) {
    console.error('Failed to delete old avatar blob:', err.message);
  }
}

async function handle(req, res) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const sql = getSql();

  if (req.method === 'DELETE') {
    const before = await sql`SELECT avatar_url FROM users WHERE id = ${userId}`;
    const rows = await sql`UPDATE users SET avatar_url = NULL WHERE id = ${userId} RETURNING *`;
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    await deleteBlobQuietly(before[0]?.avatar_url);
    return res.status(200).json(toPublicUser(rows[0]));
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (isRateLimited(userId)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'Too many attempts, please try again shortly' });
  }

  let body;
  try {
    body = await readRawBody(req);
  } catch (err) {
    if (err.message === 'TOO_LARGE') return res.status(413).json({ error: 'IMAGE_TOO_LARGE' });
    return res.status(400).json({ error: 'INVALID_BODY' });
  }
  const image = detectImageType(body);
  if (!image) {
    return res.status(400).json({ error: 'INVALID_IMAGE' });
  }

  const blob = await put(`avatars/${userId}.${image.ext}`, body, {
    access: 'public',
    contentType: image.type,
    addRandomSuffix: true,
  });

  let rows;
  let previous;
  try {
    previous = await sql`SELECT avatar_url FROM users WHERE id = ${userId}`;
    rows = await sql`UPDATE users SET avatar_url = ${blob.url} WHERE id = ${userId} RETURNING *`;
  } catch (err) {
    await deleteBlobQuietly(blob.url);
    throw err;
  }
  if (!rows[0]) {
    await deleteBlobQuietly(blob.url);
    return res.status(404).json({ error: 'User not found' });
  }
  await deleteBlobQuietly(previous[0]?.avatar_url);
  return res.status(200).json(toPublicUser(rows[0]));
}

export default async function handler(req, res) {
  try {
    return await handle(req, res);
  } catch (err) {
    console.error('Avatar request failed:', err.message);
    return res.status(500).json({ error: 'REQUEST_FAILED' });
  }
}
