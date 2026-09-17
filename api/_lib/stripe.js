import Stripe from 'stripe';

let cached;

export function getStripe() {
  if (!cached) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    cached = new Stripe(key);
  }
  return cached;
}

// Stripe wants amounts in the smallest currency unit. CRC is NOT one of
// Stripe's zero-decimal currencies (only things like JPY/KRW are) even though
// colones are quoted as whole numbers day-to-day, so it still needs * 100.
const ZERO_DECIMAL_CURRENCIES = new Set(['jpy', 'krw', 'clp', 'vnd']);

export function toStripeAmount(amount, currency) {
  const lower = currency.toLowerCase();
  const value = ZERO_DECIMAL_CURRENCIES.has(lower) ? amount : amount * 100;
  return Math.round(value);
}
