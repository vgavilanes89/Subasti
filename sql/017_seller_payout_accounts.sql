-- Run this once against the same database as 001-016.
-- Where a seller wants their sale proceeds sent. Kept in its own table (not
-- columns on users) so it can never leak through the public user profile.
-- Admins pay out manually (see 009_claims_and_payouts.sql) using this.
CREATE TABLE IF NOT EXISTS seller_payout_accounts (
  user_id TEXT PRIMARY KEY,
  method TEXT NOT NULL,            -- 'bank' (IBAN transfer) or 'sinpe' (SINPE Móvil)
  holder_name TEXT NOT NULL,
  bank_name TEXT,
  iban TEXT,
  sinpe_phone TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
