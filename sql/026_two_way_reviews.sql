-- Run after 025:
--   node scripts/run-migration.js sql/026_two_way_reviews.sql
--
-- Sellers can review buyers too. Only adds things, so the site that is live
-- when this runs keeps working. Safe to run this file again.
--
-- buyer_reviews: written by the seller about the buyer, one per order.
-- published_at: set on both reviews once both sides of an order have written.
-- Until then each stays hidden, until the 14-day review window ends.
-- removed_at: taken down by an admin. The row stays so it can't be rewritten.

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS buyer_reviews (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  removed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_buyer_reviews_buyer ON buyer_reviews(buyer_id, created_at DESC);
