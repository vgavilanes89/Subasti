-- Run this once against the same database as 001-008.
-- Adds what admin claim resolution and the manual payout ledger need.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS resolved_by TEXT;

-- A running ledger, not a real money-mover: admin records that a seller was
-- paid out some amount (by bank transfer, SINPE, etc., outside the app).
-- A seller's outstanding balance is computed as
-- SUM(completed orders' amount + shipping_cost) - SUM(their payouts.amount).
CREATE TABLE IF NOT EXISTS payouts (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  note TEXT,
  paid_out_by TEXT NOT NULL,
  paid_out_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payouts_seller ON payouts(seller_id);
