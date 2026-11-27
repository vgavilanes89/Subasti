-- Run this once, after 023:
--   node scripts/run-migration.js sql/024_terms_acceptance.sql
--
-- When each person agreed to the Terms and Privacy Policy at sign-up, and to
-- which version. Accounts created before this (or by an admin) stay empty.

ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_version TEXT;
