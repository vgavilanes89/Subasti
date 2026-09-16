-- Run this once against the same Vercel Postgres / Neon database as 001/002.

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_title TEXT NOT NULL,
  image TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CRC',
  shipping_cost NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  fulfillment TEXT NOT NULL,
  order_type TEXT NOT NULL,
  payment_method TEXT,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payment_due_at TIMESTAMPTZ,
  escrow_held_at TIMESTAMPTZ,
  ship_by_at TIMESTAMPTZ,
  shipping_timeframe TEXT,
  shipped_at TIMESTAMPTZ,
  estimated_delivery TIMESTAMPTZ,
  tracking_number TEXT,
  received_at TIMESTAMPTZ,
  confirmation_due_at TIMESTAMPTZ,
  claim_reason TEXT,
  claim_filed_at TIMESTAMPTZ,
  funds_released_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
