import { getSql } from '../_lib/db.js';
import { getActiveUserId } from '../_lib/session.js';
import { toPublicOrder, generateOrderId, generatePaymentReference, sanitizeShippingAddress } from '../_lib/orders.js';
import { getItemById } from '../_lib/items.js';
import { getSinpeNumber } from '../_lib/settings.js';
import { itemAcceptsMethod } from '../../src/data/paymentMethods.js';
import { parseSinpePhone } from '../_lib/wallet.js';
import { ESCROW_WINDOW_MS, ORDER_STATUS } from '../../src/data/escrow.js';
import { blockUnconfirmed } from '../_lib/emailConfirm.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await getActiveUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  if (await blockUnconfirmed(getSql(), userId, res)) return undefined;

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const cart = Array.isArray(body.items) ? body.items : [];
  const fulfillment = body.fulfillment === 'pickup' ? 'pickup' : 'ship';
  const paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod : null;
  const shippingAddress = fulfillment === 'ship' ? sanitizeShippingAddress(body.shippingAddress) : null;
  // SINPE Móvil: the number the buyer pays from, so the transfer can be matched to them.
  const sinpePhone = parseSinpePhone(body.sinpePhone);

  // This endpoint only creates SINPE Móvil orders, which wait for an admin to
  // verify the transfer. Card purchases are created by the Stripe webhook once
  // Stripe confirms the charge — never here, or anyone could create a "paid"
  // order without paying.
  if (paymentMethod !== 'sinpe') {
    return res.status(400).json({ error: 'INVALID_PAYMENT_METHOD' });
  }

  if (cart.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  // Recompute everything from the server's own item data rather than trusting
  // whatever price/seller the client submitted at checkout.
  const sql = getSql();
  const resolved = [];
  for (const cartItem of cart) {
    const item = await getItemById(sql, cartItem.id);
    if (!item) {
      return res.status(400).json({ error: `Item ${cartItem.id} not found` });
    }
    const requestedQty = Number.isFinite(cartItem.qty) && cartItem.qty > 0 ? Math.floor(cartItem.qty) : 1;
    // An auction is a single one-off lot.
    const qty = item.saleType === 'auc' ? 1 : requestedQty;
    resolved.push({ item, qty });
  }

  // Sellers can't buy their own listings.
  for (const { item } of resolved) {
    if (item.sellerId === userId) {
      return res.status(409).json({ error: 'OWN_ITEM', itemId: item.id });
    }
  }

  // The buyer can only pay a way the seller accepts for every item.
  const requestedMethod = paymentMethod || 'sinpe';
  for (const { item } of resolved) {
    if (!itemAcceptsMethod(item, requestedMethod)) {
      return res.status(409).json({ error: 'PAYMENT_METHOD_NOT_ACCEPTED', itemId: item.id });
    }
  }

  if (!sinpePhone) {
    return res.status(400).json({ error: 'SINPE_PHONE_REQUIRED' });
  }
  // Without Subasti's own SINPE number there is nowhere to send the transfer.
  if (!(await getSinpeNumber(sql))) {
    return res.status(503).json({ error: 'SINPE_UNAVAILABLE' });
  }

  // An auction can only be bought outright through its Buy Now price, and
  // only while it's still running — otherwise `buyNowPrice || price` below
  // would quietly sell it at the starting price.
  for (const { item } of resolved) {
    if (item.saleType === 'auc' && (!item.buyNowPrice || !item.endAt || item.endAt <= Date.now())) {
      return res.status(409).json({ error: 'AUCTION_NOT_BUYABLE', itemId: item.id });
    }
  }

  // Reserve stock before charging/committing any order — guarded UPDATE so a
  // race between two concurrent buyers can't both succeed off the same units.
  // If a later line in a multi-item cart is out of stock, put back what this
  // request already reserved rather than leaving stock short with no order.
  const reserved = [];
  const rollback = async () => {
    for (const r of reserved) {
      if (r.item.saleType === 'auc') {
        await sql`UPDATE items SET end_at = ${new Date(r.item.endAt)} WHERE id = ${r.item.id}`;
      } else {
        await sql`UPDATE items SET quantity = quantity + ${r.qty} WHERE id = ${r.item.id}`;
      }
    }
  };
  for (const { item, qty } of resolved) {
    if (item.saleType === 'auc') {
      // Buying an auction outright ends it. Guarded on end_at so two buyers
      // racing for the same Buy Now can't both succeed.
      const ended = await sql`
        UPDATE items SET end_at = now() WHERE id = ${item.id} AND sale_type = 'auc' AND end_at > now() RETURNING id
      `;
      if (!ended[0]) {
        await rollback();
        return res.status(409).json({ error: 'AUCTION_NOT_BUYABLE', itemId: item.id });
      }
      reserved.push({ item, qty });
      continue;
    }
    if (item.saleType !== 'buy') continue;
    const decremented = await sql`
      UPDATE items SET quantity = quantity - ${qty} WHERE id = ${item.id} AND quantity >= ${qty} RETURNING id
    `;
    if (!decremented[0]) {
      await rollback();
      return res.status(409).json({ error: 'OUT_OF_STOCK', itemId: item.id });
    }
    reserved.push({ item, qty });
  }

  const now = Date.now();
  // One reference for the whole checkout: the buyer makes a single transfer.
  const paymentReference = generatePaymentReference();
  const inserted = [];
  for (const { item, qty } of resolved) {
    const unitPrice = item.buyNowPrice || item.price;
    const id = generateOrderId();
    const amount = unitPrice * qty;
    const shippingCost = fulfillment === 'ship' ? (item.shippingCost || 0) : 0;
    const payByAt = now + ESCROW_WINDOW_MS;

    const rows = await sql`
      INSERT INTO orders (
        id, buyer_id, seller_id, item_id, item_title, image, amount, currency,
        shipping_cost, status, fulfillment, order_type, payment_method,
        purchased_at, payment_due_at, shipping_address, sinpe_phone, payment_reference, quantity
      ) VALUES (
        ${id}, ${userId}, ${item.sellerId}, ${item.id}, ${item.title}, ${item.image},
        ${amount}, ${item.currency || 'CRC'}, ${shippingCost}, ${ORDER_STATUS.PENDING_PAYMENT},
        ${fulfillment}, 'buy_now', 'sinpe',
        to_timestamp(${now} / 1000.0), to_timestamp(${payByAt} / 1000.0),
        ${shippingAddress ? JSON.stringify(shippingAddress) : null}, ${sinpePhone}, ${paymentReference}, ${qty}
      )
      RETURNING *
    `;
    inserted.push(toPublicOrder(rows[0]));
    // The seller is told about the sale once an admin confirms the transfer arrived.
  }

  return res.status(201).json(inserted);
}
