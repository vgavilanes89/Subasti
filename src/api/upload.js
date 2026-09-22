import { upload } from '@vercel/blob/client';

// Uploads directly from the browser to Blob storage using a short-lived
// token from /api/upload/image-token — the image bytes never pass through
// our own serverless function, so there's no request-body size limit here.
export const uploadImage = async (file) => {
    const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload/image-token',
    });
    return blob.url;
};
