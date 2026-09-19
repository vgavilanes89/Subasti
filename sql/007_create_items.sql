-- Run this once against the same database as 001-006.
-- Moves the item catalog off the client-side mock array (src/api/items.js)
-- and onto Postgres, so admin tooling and analytics have real data to work
-- from instead of a per-session in-memory list that resets on every reload.

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  sub_category TEXT,
  currency TEXT NOT NULL DEFAULT 'CRC',
  price NUMERIC NOT NULL,
  image TEXT,
  images JSONB NOT NULL DEFAULT '[]',
  sale_type TEXT NOT NULL, -- 'buy' | 'auc'
  condition TEXT,
  condition_detail TEXT,
  seller_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  shipping_ship BOOLEAN NOT NULL DEFAULT FALSE,
  shipping_local BOOLEAN NOT NULL DEFAULT FALSE,
  shipping_cost NUMERIC NOT NULL DEFAULT 0,
  buy_now_price NUMERIC,
  current_bid NUMERIC,
  bids INTEGER NOT NULL DEFAULT 0,
  reserve_price NUMERIC,
  end_at TIMESTAMPTZ,
  highest_bidder_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_items_seller ON items(seller_id);
CREATE INDEX IF NOT EXISTS idx_items_sale_type ON items(sale_type);
