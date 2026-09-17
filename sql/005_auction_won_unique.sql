-- Run this once against the same database as 001-004.
-- Without this, two concurrent settle-auction requests for the same
-- item+buyer (e.g. React StrictMode's double-invoked effect, two tabs,
-- or a fast double-click) can both pass the "does an order already
-- exist" check before either INSERT lands, creating duplicate orders.

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_auction_won_unique
ON orders(item_id, buyer_id)
WHERE order_type = 'auction_won';
