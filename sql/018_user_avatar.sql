-- Run this once against the same database as 001-017.
-- A user's profile picture (a Vercel Blob URL set only by /api/account/avatar,
-- never accepted from the client as a free-form URL).
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
