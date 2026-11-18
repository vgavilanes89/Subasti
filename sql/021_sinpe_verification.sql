-- Run this once, after 020:
--   node scripts/run-migration.js sql/021_sinpe_verification.sql
--
-- SINPE Móvil payments are verified by an admin: the buyer transfers to
-- Subasti's own SINPE number using a payment reference, the buyer reports the
-- transfer, and an admin confirms the money arrived — only then does the order
-- move into escrow.

-- One reference per checkout (shared by all orders paid with one transfer),
-- e.g. SUB-7K3Q9X. The buyer puts it in the SINPE description so the admin can
-- find the transfer.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reported_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_verified_by TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON orders(payment_reference);

-- Units bought, so cancelling an unpaid order can put the stock back.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 1;
