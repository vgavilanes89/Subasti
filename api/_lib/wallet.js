import { randomUUID } from 'crypto';
import { getStripe } from './stripe.js';
import { COSTA_RICA_LOCATIONS } from '../../src/data/Constants.js';

// ---- Saved addresses ----------------------------------------------------

export const MAX_ADDRESSES = 10;
export const MAX_SINPE_NUMBERS = 5;

const clean = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

// Returns { value } or { error } with a stable code the client translates.
export function parseAddress(body) {
  const fullName = clean(body.fullName, 100);
  const address = clean(body.address, 200);
  const province = clean(body.province, 50);
  const city = clean(body.city, 80);
  const postalCode = clean(body.postalCode, 12);
  let alias = clean(body.alias, 40);

  if (fullName.length < 3) return { error: 'INVALID_NAME' };
  if (address.length < 5) return { error: 'INVALID_ADDRESS' };
  if (!COSTA_RICA_LOCATIONS[province]) return { error: 'INVALID_PROVINCE' };
  if (!COSTA_RICA_LOCATIONS[province].includes(city)) return { error: 'INVALID_CITY' };
  if (postalCode.length < 3) return { error: 'INVALID_POSTAL_CODE' };
  if (!alias) alias = city;

  return { value: { alias, fullName, address, province, city, postalCode, country: 'Costa Rica' } };
}

export function toPublicAddress(row) {
  return {
    id: row.id,
    alias: row.alias,
    fullName: row.full_name,
    address: row.address,
    city: row.city,
    province: row.province,
    postalCode: row.postal_code,
    country: row.country,
    isDefault: !!row.is_default,
  };
}

export const generateAddressId = () => `addr_${randomUUID()}`;
export const generateSinpeId = () => `sinpe_${randomUUID()}`;

// ---- Saved SINPE numbers ------------------------------------------------

// Costa Rican mobile numbers are 8 digits; accept "8888-8888" / "8888 8888".
export function parseSinpePhone(value) {
  const digits = typeof value === 'string' ? value.replace(/\D/g, '') : '';
  return /^\d{8}$/.test(digits) ? digits : null;
}

export function toPublicSinpe(row) {
  return { id: row.id, alias: row.alias || '', phone: row.phone };
}

// ---- Stripe customer / saved cards -------------------------------------

// Every buyer who saves a card gets one Stripe Customer; it is created lazily
// and its id kept on the user row. Saved cards are attached to that customer.
export async function ensureStripeCustomer(sql, userId) {
  const rows = await sql`SELECT id, email, real_name, profile_name, stripe_customer_id FROM users WHERE id = ${userId}`;
  const user = rows[0];
  if (!user) return null;
  if (user.stripe_customer_id) return user.stripe_customer_id;

  const customer = await getStripe().customers.create({
    email: user.email || undefined,
    name: user.real_name || user.profile_name || undefined,
    metadata: { userId: String(userId) },
  });
  // If two requests raced, keep whichever id landed first.
  const updated = await sql`
    UPDATE users SET stripe_customer_id = ${customer.id}
    WHERE id = ${userId} AND stripe_customer_id IS NULL
    RETURNING stripe_customer_id
  `;
  if (updated[0]) return updated[0].stripe_customer_id;
  const again = await sql`SELECT stripe_customer_id FROM users WHERE id = ${userId}`;
  return again[0]?.stripe_customer_id || customer.id;
}

export async function getStripeCustomerId(sql, userId) {
  const rows = await sql`SELECT stripe_customer_id FROM users WHERE id = ${userId}`;
  return rows[0]?.stripe_customer_id || null;
}

export function toPublicCard(pm) {
  return {
    id: pm.id,
    brand: pm.card?.brand || 'card',
    last4: pm.card?.last4 || '',
    expMonth: pm.card?.exp_month || null,
    expYear: pm.card?.exp_year || null,
  };
}

// True only if this Stripe payment method belongs to this user's customer —
// stops one user from charging or removing another user's saved card by id.
export async function userOwnsPaymentMethod(sql, userId, paymentMethodId) {
  if (typeof paymentMethodId !== 'string' || !paymentMethodId.startsWith('pm_')) return false;
  const customerId = await getStripeCustomerId(sql, userId);
  if (!customerId) return false;
  try {
    const pm = await getStripe().paymentMethods.retrieve(paymentMethodId);
    return pm.customer === customerId;
  } catch {
    return false;
  }
}

// Extra PaymentIntent options for "pay with a saved card" or "save this card
// for next time", read from the checkout request body. Returns
// { params } to spread into paymentIntents.create, or { error, status }.
export async function savedCardIntentOptions(sql, userId, body) {
  const paymentMethodId = typeof body.paymentMethodId === 'string' ? body.paymentMethodId : '';

  if (paymentMethodId) {
    if (!(await userOwnsPaymentMethod(sql, userId, paymentMethodId))) {
      return { error: 'INVALID_PAYMENT_METHOD', status: 403 };
    }
    return {
      params: {
        customer: await getStripeCustomerId(sql, userId),
        payment_method: paymentMethodId,
        // Saved cards never need a redirect page; 3-D Secure still works in a popup.
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      },
    };
  }

  if (body.saveCard === true) {
    const customer = await ensureStripeCustomer(sql, userId);
    if (!customer) return { error: 'USER_NOT_FOUND', status: 404 };
    return { params: { customer, setup_future_usage: 'on_session' } };
  }

  return { params: {} };
}
