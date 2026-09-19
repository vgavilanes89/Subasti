-- Run this once against the same database as 001-009.

-- Items only ever stored the CURRENT highest bid/bidder; nothing recorded
-- who bid what before being outbid. This logs every successful bid going
-- forward (see api/items/bid.js) so a user's bidding history is real.
CREATE TABLE IF NOT EXISTS bid_history (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  bidder_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  placed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bid_history_item ON bid_history(item_id);
CREATE INDEX IF NOT EXISTS idx_bid_history_bidder ON bid_history(bidder_id);

-- Favorites/watchlist used to be pure client-side React state, never saved
-- anywhere — invisible to admin and lost on browser storage clear.
CREATE TABLE IF NOT EXISTS favorites (
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_id)
);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
