// Uploads one (already compressed) image at a time to /api/upload/image,
// which puts it straight into Blob storage. Each file is small enough
// (~100-500KB after client-side compression) to comfortably clear Vercel's
// request-body limit even though it still goes through our own function.
export const uploadImage = async (file) => {
    const res = await fetch('/api/upload/image', {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'UPLOAD_FAILED');
    }
    const { url } = await res.json();
    return url;
};
