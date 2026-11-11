const OUTPUT_SIZE = 256;
const MAX_INPUT_BYTES = 15 * 1024 * 1024;

// Center-crops to a square and shrinks to 256x256 JPEG in the browser, so the
// upload is tiny (tens of KB) no matter how big the original photo was.
// Errors: NOT_AN_IMAGE, FILE_TOO_LARGE, UNREADABLE_IMAGE.
export async function prepareAvatar(file) {
    if (!file || !String(file.type).startsWith('image/')) throw new Error('NOT_AN_IMAGE');
    if (file.size > MAX_INPUT_BYTES) throw new Error('FILE_TOO_LARGE');

    let bitmap;
    try {
        // 'from-image' applies the photo's EXIF rotation so phone photos aren't sideways.
        bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
        try {
            bitmap = await createImageBitmap(file);
        } catch {
            throw new Error('UNREADABLE_IMAGE');
        }
    }

    const side = Math.min(bitmap.width, bitmap.height);
    const sx = Math.floor((bitmap.width - side) / 2);
    const sy = Math.floor((bitmap.height - side) / 2);
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; // flattens transparent PNGs onto white for JPEG
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    if (bitmap.close) bitmap.close();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob) throw new Error('UNREADABLE_IMAGE');
    return blob;
}
