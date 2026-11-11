-- Run this once against the same database as 001-015.
-- Snapshot of the buyer's delivery address at purchase time so the seller
-- can see where to ship. Null for pickup orders and orders placed before this.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address JSONB;
ALTER TABLE pending_checkouts ADD COLUMN IF NOT EXISTS shipping_address JSONB;
