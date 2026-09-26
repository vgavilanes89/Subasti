-- Run this once against the same database as 001-014.

ALTER TABLE items ADD COLUMN IF NOT EXISTS attributes JSONB NOT NULL DEFAULT '{}'::jsonb;
