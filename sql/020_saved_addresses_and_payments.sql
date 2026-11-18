-- Run this once against the same database as 001-019.
--   node scripts/run-migration.js sql/020_saved_addresses_and_payments.sql
--
-- Saved addresses and saved payment methods for buyers.
-- Cards are NEVER stored here: card details live only at Stripe. We keep just
-- the Stripe customer id, and ask Stripe for the saved cards (brand, last 4,
-- expiry) when we need to show them.

CREATE TABLE IF NOT EXISTS saved_addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  alias TEXT NOT NULL,
  full_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Costa Rica',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_saved_addresses_user ON saved_addresses(user_id);

-- The buyer's own SINPE Móvil number (the number they pay FROM), so checkout can
-- pre-fill it and the payment can be matched to the right person.
CREATE TABLE IF NOT EXISTS saved_sinpe_numbers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  alias TEXT,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, phone)
);
CREATE INDEX IF NOT EXISTS idx_saved_sinpe_user ON saved_sinpe_numbers(user_id);

ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
-- Which saved method is preferred: 'card:<stripe payment method id>' or 'sinpe:<id>'.
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_payment TEXT;

-- The number a buyer said they paid from, recorded on SINPE Móvil orders.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sinpe_phone TEXT;
