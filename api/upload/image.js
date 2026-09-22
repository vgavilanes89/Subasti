import { put } from '@vercel/blob';
import { getUserIdFromRequest } from '../_lib/session.js';

// Takes the raw image body (already downscaled/compressed client-side, so
// this is one photo at a time — comfortably under Vercel's ~4.5MB request
// limit even before compression) and uploads it straight to Blob storage.
export const config = {
  api: {
    bodyParser: false,
  },
};

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 8 * 1024 * 1024;

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const contentType = req.headers['content-type'] || '';
  if (!ALLOWED_TYPES.has(contentType)) {
    return res.status(400).json({ error: 'INVALID_CONTENT_TYPE' });
  }

  let body;
  try {
    body = await readRawBody(req);
  } catch (err) {
    if (err.message === 'TOO_LARGE') {
      return res.status(413).json({ error: 'IMAGE_TOO_LARGE' });
    }
    return res.status(400).json({ error: 'INVALID_BODY' });
  }
  if (body.length === 0) {
    return res.status(400).json({ error: 'EMPTY_BODY' });
  }

  const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
  const blob = await put(`items/${userId}-${Date.now()}.${ext}`, body, {
    access: 'public',
    contentType,
    addRandomSuffix: true,
  });

  return res.status(200).json({ url: blob.url });
}
