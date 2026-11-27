-- Run this once, after 022:
--   node scripts/run-migration.js sql/023_rate_limits.sql
--
-- Attempt counters that every server instance shares (the in-memory limiter
-- only counts within one instance). Used to cap cédula lookups, which cost
-- money and reveal a person's name.

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  hits INT NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, window_start)
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);
