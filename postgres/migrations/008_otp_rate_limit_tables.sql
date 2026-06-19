-- Migration 008: OTP codes + rate-limit tables
-- These tables are referenced by app/lib/auth/otp.ts and rate-limit.ts
-- but were never created in any prior migration. Without them, every
-- /api/auth/request-otp and /api/auth/verify-otp call returns 500.

CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone);

CREATE TABLE IF NOT EXISTS otp_rate_limits (
  phone TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reset_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_auth_rl_ip_endpoint ON auth_rate_limits(ip_address, endpoint);