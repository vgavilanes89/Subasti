-- Run after 024:
--   node scripts/run-migration.js sql/025_listing_removal_and_reviews.sql
--
-- removed_at: a listing its seller took down but that bids, orders or chats
-- still point to. It is hidden from the site rather than erased.
-- reviews: one per completed or refunded order, written by the buyer.
-- used_condition: the seller's grade for a used item (like_new, good, fair,
-- parts_only). Safe to run this file again.

ALTER TABLE items ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ;
ALTER TABLE items ADD COLUMN IF NOT EXISTS used_condition TEXT;

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  seller_id TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  item_title TEXT NOT NULL DEFAULT '',
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_seller ON reviews(seller_id, created_at DESC);
