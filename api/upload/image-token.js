import { handleUpload } from '@vercel/blob/client';
import { getUserIdFromRequest } from '../_lib/session.js';

// Issues short-lived, scoped tokens so the browser can PUT image bytes
// straight to Blob storage — never through this function's body parser,
// which is what let a normal multi-photo listing hit Vercel's ~4.5MB
// serverless request limit before. This route only ever sees a small JSON
// handshake, never the image itself.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maximumSizeInBytes: 8 * 1024 * 1024,
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {
        // No DB side effect needed — the client includes the resulting URL
        // directly when it creates/updates the item. (This callback also
        // never fires under `vercel dev`, since Blob can't reach localhost.)
      },
    });
    return res.status(200).json(jsonResponse);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
