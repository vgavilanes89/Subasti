-- Run this once against the same database as 001-018.
-- Which payment methods the seller accepts for each listing ('card', 'sinpe').
-- Existing listings were payable both ways, so they keep accepting both.
ALTER TABLE items ADD COLUMN IF NOT EXISTS payment_methods JSONB NOT NULL DEFAULT '["card","sinpe"]'::jsonb;
