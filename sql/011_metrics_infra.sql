-- Run this once against the same database as 001-010.
-- Infrastructure for the admin Analytics build-out: a configurable commission
-- rate, login activity (for DAU/MAU), and lightweight search/item-view
-- logging (for conversion rate and zero-result search terms).

CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT INTO platform_settings (key, value) VALUES ('commission_rate', '0')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS login_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  logged_in_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_login_events_user ON login_events(user_id);
CREATE INDEX IF NOT EXISTS idx_login_events_time ON login_events(logged_in_at);

CREATE TABLE IF NOT EXISTS search_events (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  result_count INTEGER NOT NULL,
  user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_search_events_time ON search_events(created_at);

CREATE TABLE IF NOT EXISTS item_view_events (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_item_view_events_time ON item_view_events(created_at);
