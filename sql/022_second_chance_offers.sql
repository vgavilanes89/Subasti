-- Run this once, after 021:
--   node scripts/run-migration.js sql/022_second_chance_offers.sql
--
-- Second-chance offers: when an auction ends below its reserve price, the
-- seller may offer the item to the highest bidder, who accepts or declines.

CREATE TABLE IF NOT EXISTS second_chance_offers (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  bidder_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  -- pending | accepted | declined | withdrawn. A pending offer past expires_at counts as expired.
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  order_id TEXT
);

-- One offer per auction. Only a withdrawn one can be replaced.
CREATE UNIQUE INDEX IF NOT EXISTS idx_second_chance_one_per_item
  ON second_chance_offers(item_id) WHERE status <> 'withdrawn';
CREATE INDEX IF NOT EXISTS idx_second_chance_bidder ON second_chance_offers(bidder_id);
CREATE INDEX IF NOT EXISTS idx_second_chance_seller ON second_chance_offers(seller_id);
