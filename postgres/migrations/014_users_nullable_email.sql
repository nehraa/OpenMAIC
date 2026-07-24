-- Migration 014: classroom students authenticate by phone/OTP and therefore
-- do not have an email address. PostgreSQL UNIQUE permits multiple NULLs, so
-- nullable email preserves teacher uniqueness without fake empty addresses.

ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
