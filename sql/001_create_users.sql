-- Run this once against your Vercel Postgres / Neon database
-- (Vercel dashboard → Storage → your database → Query, or `psql "$POSTGRES_URL"`).

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  account_number TEXT UNIQUE NOT NULL,
  cedula TEXT UNIQUE NOT NULL,
  real_name TEXT NOT NULL,
  profile_name TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  country_code TEXT NOT NULL,
  phone TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
