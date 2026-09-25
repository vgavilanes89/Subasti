-- Run this once against the same database as 001-012.

ALTER TABLE items ADD COLUMN IF NOT EXISTS item_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS return_policy TEXT;

-- Backfill a human-readable item number for anything created before this
-- column existed (new items get one from api/items/create.js going forward).
UPDATE items SET item_number = 'ITM-' || LPAD((10000000 + (RANDOM() * 89999999)::int)::text, 8, '0')
WHERE item_number IS NULL;

ALTER TABLE items ALTER COLUMN item_number SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_items_item_number ON items(item_number);
