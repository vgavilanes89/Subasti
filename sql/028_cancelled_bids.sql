-- Run after 027:
--   node scripts/run-migration.js sql/028_cancelled_bids.sql
--
-- Only adds a column, so the site that is live when this runs keeps working.
-- Safe to run this file again.
--
-- cancelled_at: a bid taken out of an auction because its account was
-- suspended. The row is kept as a record of what that account did.

ALTER TABLE bid_history ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
