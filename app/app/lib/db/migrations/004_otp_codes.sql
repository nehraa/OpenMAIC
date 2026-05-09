-- Migration 004: OTP Codes Storage
-- Replaces in-memory Map with database-backed storage for serverless compatibility

-- ============================================================================
-- OTP CODES TABLE
-- ============================================================================
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast phone lookups and expiration cleanup
CREATE INDEX idx_otp_phone ON otp_codes(phone);
CREATE INDEX idx_otp_expires ON otp_codes(expires_at);

-- ============================================================================
-- OTP RATE LIMIT TABLE
-- ============================================================================
CREATE TABLE otp_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL UNIQUE,
  request_count INT NOT NULL DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rate_limit_phone ON otp_rate_limits(phone);
CREATE INDEX idx_rate_limit_reset ON otp_rate_limits(reset_at);

-- Updated_at trigger for rate_limits
CREATE TRIGGER update_otp_rate_limits_updated_at
  BEFORE UPDATE ON otp_rate_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CLEANUP FUNCTION: Remove expired OTPs
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_otp_codes()
RETURNS INT AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM otp_codes WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CLEANUP FUNCTION: Remove expired rate limits
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_otp_rate_limits()
RETURNS INT AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM otp_rate_limits WHERE reset_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
