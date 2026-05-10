-- Migration 003: Add email and password_hash columns to users
-- These columns were missing from the initial schema

ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Backfill existing teachers with a placeholder hash (they won't be able to login without re-setting password)
UPDATE users SET email = phone_e164 || '@placeholder.invalid' WHERE email IS NULL AND role = 'teacher';
UPDATE users SET password_hash = 'REPLACE_ME' WHERE password_hash IS NULL AND role = 'teacher';

-- Make email required for teachers
ALTER TABLE users ALTER COLUMN email SET NOT NULL;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);