-- Run this once against the same database as 001/002/003.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT;

-- Holds the resolved cart between "PaymentIntent created" and "webhook confirms
-- payment succeeded" — the webhook is the only trusted signal that money was
-- actually captured, so real orders are only created once it fires, using the
-- snapshot recorded here (never trusting the client's own "it worked" claim).
CREATE TABLE IF NOT EXISTS pending_checkouts (
  payment_intent_id TEXT PRIMARY KEY,
  buyer_id TEXT NOT NULL,
  fulfillment TEXT NOT NULL,
  cart JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
