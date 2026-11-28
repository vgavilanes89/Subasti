-- Run after 026:
--   node scripts/run-migration.js sql/027_email_confirmation_and_reports.sql
--
-- Only adds things, so the site that is live when this runs keeps working.
-- Safe to run this file again.
--
-- email_confirm_required: set on accounts that sign up while confirmation is
-- switched on. Older and admin-created accounts stay FALSE.
-- reports: people flagging a listing or an account for an admin to look at.

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_confirm_required BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('item', 'user')),
  target_id TEXT NOT NULL,
  target_label TEXT NOT NULL DEFAULT '',
  owner_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  closed_by TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_one_open ON reports(reporter_id, target_type, target_id) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at DESC);
