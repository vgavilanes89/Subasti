import { getSql } from '../_lib/db.js';
import { getUserIdFromRequest } from '../_lib/session.js';
import { toPublicItem, generateItemId, generateItemNumber } from '../_lib/items.js';
import { parseListingInput, DAY_MS } from '../_lib/listing.js';

const UNIQUE_VIOLATION = '23505';
const MAX_ITEM_NUMBER_ATTEMPTS = 5;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const saleType = body.saleType === 'auc' ? 'auc' : 'buy';
  const parsed = parseListingInput(body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const {
    title, description, category, subCategory, condition, conditionDetail, currency, price, images,
    shippingShip, shippingLocal, shippingCost, attributes, paymentMethods,
  } = parsed.value;

  let quantity = 1;
  let buyNowPrice = null;
  let reservePrice = null;
  let currentBid = null;
  let bids = 0;
  let endAt = null;

  if (saleType === 'buy') {
    quantity = parsed.value.quantity;
  } else {
    const durationDays = Number.isFinite(Number(body.auctionDuration)) ? Number(body.auctionDuration) : 7;
    endAt = new Date(Date.now() + durationDays * DAY_MS);
    currentBid = price;
    bids = 0;
    reservePrice = parsed.value.reservePrice;
    buyNowPrice = parsed.value.buyNowPrice;
  }

  const sql = getSql();
  const id = generateItemId();

  let attempt = 0;
  while (attempt < MAX_ITEM_NUMBER_ATTEMPTS) {
    attempt += 1;
    const itemNumber = generateItemNumber();
    try {
      const rows = await sql`
        INSERT INTO items (
          id, item_number, title, description, category, sub_category, currency, price, image, images,
          sale_type, condition, condition_detail, seller_id, quantity,
          shipping_ship, shipping_local, shipping_cost, buy_now_price,
          current_bid, bids, reserve_price, end_at, attributes, payment_methods
        ) VALUES (
          ${id}, ${itemNumber}, ${title}, ${description}, ${category}, ${subCategory}, ${currency}, ${price}, ${images[0]}, ${JSON.stringify(images)},
          ${saleType}, ${condition}, ${conditionDetail}, ${userId}, ${quantity},
          ${shippingShip}, ${shippingLocal}, ${shippingCost}, ${buyNowPrice},
          ${currentBid}, ${bids}, ${reservePrice}, ${endAt}, ${JSON.stringify(attributes)}, ${JSON.stringify(paymentMethods)}
        )
        RETURNING *
      `;
      return res.status(201).json(toPublicItem(rows[0], { includeReserve: true }));
    } catch (err) {
      if (err.code === UNIQUE_VIOLATION && (err.constraint || '').includes('item_number')) {
        continue; // collision on the random item number — retry with a new one
      }
      throw err;
    }
  }
  return res.status(500).json({ error: 'Could not generate a unique item number' });
}
