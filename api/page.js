import { getSql } from './_lib/db.js';
import { isSuspendedUser } from './_lib/items.js';
import { escapeHtml, formatMoney } from './_lib/notify.js';
import { DEFAULT_META, SITE_NAME, pageTitle, summarize } from '../src/data/pageMeta.js';

// What WhatsApp, Facebook and other link previewers are given for an item or
// seller link. They don't run the site's JavaScript, so vercel.json sends only
// them here; people (and Google, which does run it) get the app as usual.
// Spanish, the site's main language: a preview has no reader's language to go by.
const appUrl = () => process.env.APP_URL || 'https://subasti.vercel.app';
const fallbackImage = () => `${appUrl()}/og-image.jpg`;

// Previewers can't show SVG, which is what the placeholder service returns.
const usableImage = (url) => typeof url === 'string' && /^https:\/\//.test(url)
  && !url.includes('placehold.co') && !/\.svg(\?|$)/i.test(url);

async function itemMeta(sql, id) {
  const row = (await sql`SELECT * FROM items WHERE id = ${id}`)[0];
  if (!row || row.removed_at || await isSuspendedUser(sql, row.seller_id)) return null;
  const auction = row.sale_type === 'auc';
  const price = formatMoney(auction ? (row.current_bid ?? row.price) : row.price, row.currency || 'CRC');
  const ended = auction && row.end_at && new Date(row.end_at).getTime() < Date.now();
  const facts = [
    auction ? (ended ? 'Subasta finalizada' : `Subasta, puja actual ${price}`) : `Compra inmediata ${price}`,
    row.condition === 'used' ? 'Usado' : 'Nuevo',
  ].join(' · ');
  return {
    title: pageTitle(`${row.title} · ${price}`),
    description: summarize(`${facts}. ${row.description || ''}`, 200),
    image: usableImage(row.image) ? row.image : null,
    path: `/item/${encodeURIComponent(row.id)}`,
  };
}

// Only what the public profile page shows, and never the person's photo.
async function sellerMeta(sql, id) {
  const row = (await sql`SELECT id, profile_name, city, province, is_suspended FROM users WHERE id::text = ${id}`)[0];
  if (!row || row.is_suspended) return null;
  const place = [row.city, row.province].filter(Boolean).join(', ');
  return {
    title: pageTitle(row.profile_name),
    description: summarize(`Publicaciones y reseñas de ${row.profile_name} en ${SITE_NAME}${place ? ` · ${place}` : ''}.`),
    image: null,
    path: `/seller/${encodeURIComponent(String(row.id))}`,
  };
}

const render = ({ title, description, image, path }) => {
  const url = `${appUrl()}${path}`;
  const e = escapeHtml;
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)}</title>
<meta name="description" content="${e(description)}">
<link rel="canonical" href="${e(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${e(SITE_NAME)}">
<meta property="og:locale" content="es_CR">
<meta property="og:title" content="${e(title)}">
<meta property="og:description" content="${e(description)}">
<meta property="og:url" content="${e(url)}">
<meta property="og:image" content="${e(image || fallbackImage())}">
${image ? '' : '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n'}<meta name="twitter:card" content="summary_large_image">
</head>
<body>
<h1>${e(title)}</h1>
<p>${e(description)}</p>
<p><a href="${e(url)}">Abrir en ${e(SITE_NAME)}</a></p>
</body>
</html>
`;
};

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const type = req.query.type;
  const id = typeof req.query.id === 'string' ? req.query.id : '';
  let meta = null;
  let status = 200;
  try {
    const sql = getSql();
    if (type === 'item' && id) meta = await itemMeta(sql, id);
    else if (type === 'seller' && id) meta = await sellerMeta(sql, id);
    if (!meta) status = 404;
  } catch (err) {
    console.error('Link preview failed:', err.message);
  }

  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Never cached: the same address gives people the app, and a listing can be
  // removed at any time.
  res.setHeader('Cache-Control', 'no-store');
  return res.end(render(meta || { ...DEFAULT_META.es, image: null, path: '/' }));
}
