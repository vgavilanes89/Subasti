import { getSql } from '../_lib/db.js';
import { getRequestingAdmin } from '../_lib/admin.js';
import { toPublicItem } from '../_lib/items.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await getRequestingAdmin(req);
  if (!admin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const id = typeof body.id === 'string' ? body.id : '';
  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const subCategory = typeof body.subCategory === 'string' && body.subCategory.trim() ? body.subCategory.trim() : null;
  const currency = body.currency === 'USD' ? 'USD' : 'CRC';
  const price = Number(body.price);
  const condition = body.condition === 'used' ? 'used' : 'new';
  const conditionDetail = condition === 'used' && typeof body.conditionDetail === 'string'
    ? body.conditionDetail.trim() || null
    : null;
  const shippingShip = Boolean(body.shippingShip);
  const shippingLocal = Boolean(body.shippingLocal);
  const shippingCost = shippingShip ? Number(body.shippingCost) || 0 : 0;

  if (!title || title.length < 10) return res.status(400).json({ error: 'INVALID_TITLE' });
  if (!category) return res.status(400).json({ error: 'INVALID_CATEGORY' });
  if (!Number.isFinite(price) || price <= 0) return res.status(400).json({ error: 'INVALID_PRICE' });

  const sql = getSql();
  const existing = await sql`SELECT sale_type FROM items WHERE id = ${id}`;
  if (!existing[0]) {
    return res.status(404).json({ error: 'Item not found' });
  }
  const saleType = existing[0].sale_type;

  let rows;
  if (saleType === 'auc') {
    let reservePrice = null;
    if (body.reservePrice) {
      const rp = Number(body.reservePrice);
      if (Number.isFinite(rp) && rp > 0) reservePrice = rp;
    }
    let buyNowPrice = null;
    if (body.buyNowPrice) {
      const bnp = Number(body.buyNowPrice);
      if (Number.isFinite(bnp) && bnp > 0) buyNowPrice = bnp;
    }
    const endAt = new Date(body.endAt);
    if (!body.endAt || Number.isNaN(endAt.getTime())) {
      return res.status(400).json({ error: 'INVALID_END_DATE' });
    }

    rows = await sql`
      UPDATE items SET
        title = ${title}, description = ${description}, category = ${category}, sub_category = ${subCategory},
        currency = ${currency}, price = ${price}, condition = ${condition}, condition_detail = ${conditionDetail},
        shipping_ship = ${shippingShip}, shipping_local = ${shippingLocal}, shipping_cost = ${shippingCost},
        buy_now_price = ${buyNowPrice}, reserve_price = ${reservePrice}, end_at = ${endAt}
      WHERE id = ${id}
      RETURNING *
    `;
  } else {
    const quantity = Number.isFinite(Number(body.quantity)) && Number(body.quantity) > 0
      ? Math.floor(Number(body.quantity))
      : 1;

    rows = await sql`
      UPDATE items SET
        title = ${title}, description = ${description}, category = ${category}, sub_category = ${subCategory},
        currency = ${currency}, price = ${price}, condition = ${condition}, condition_detail = ${conditionDetail},
        quantity = ${quantity},
        shipping_ship = ${shippingShip}, shipping_local = ${shippingLocal}, shipping_cost = ${shippingCost}
      WHERE id = ${id}
      RETURNING *
    `;
  }

  return res.status(200).json(toPublicItem(rows[0]));
}
