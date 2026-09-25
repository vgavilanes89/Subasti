-- Run this once against the same database as 001-013.
-- Replaces the in-memory mock in src/api/messages.js with real persistence,
-- and adds a generic notifications table (outbid, order status changes).

CREATE TABLE IF NOT EXISTS message_threads (
  id TEXT PRIMARY KEY,
  item_id TEXT,
  item_title TEXT,
  seller_id TEXT NOT NULL,
  buyer_id TEXT NOT NULL,
  seller_last_read_at TIMESTAMPTZ,
  buyer_last_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (item_id, buyer_id)
);
CREATE INDEX IF NOT EXISTS idx_message_threads_seller ON message_threads(seller_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_buyer ON message_threads(buyer_id);

CREATE TABLE IF NOT EXISTS thread_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_thread_messages_thread ON thread_messages(thread_id);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'outbid' | 'order_status' | ...
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
