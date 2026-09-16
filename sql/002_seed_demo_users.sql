-- Optional: recreates the old mock admin/user1/user2 as real accounts so the
-- same demo logins keep working after switching auth to Postgres. Skip this
-- if you don't need those demo credentials anymore.
-- Passwords match the old mock values (admin/123/123) — change them after
-- seeding if this database is public-facing.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (account_number, cedula, real_name, profile_name, email, password_hash, country_code, phone, province, city, is_admin)
VALUES
  ('SUB-00000001', '0-0000-0000', 'Admin User', 'Admin', 'admin@subasti.com', crypt('admin', gen_salt('bf')), '+506', '0000-0000', 'San José', 'San José', TRUE),
  ('SUB-10018374', '1-1234-5678', 'Ana Rodriguez', 'AnaRdz', 'ana@subasti.com', crypt('123', gen_salt('bf')), '+506', '8888-8888', 'San José', 'San José', FALSE),
  ('SUB-29475638', '2-2222-2222', 'Carlos Perez', 'CPerez', 'carlos@subasti.com', crypt('123', gen_salt('bf')), '+506', '7777-7777', 'Heredia', 'Heredia', FALSE)
ON CONFLICT (email) DO NOTHING;
