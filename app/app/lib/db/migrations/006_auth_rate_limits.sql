-- Migration 006: Auth Rate Limiting
-- Rate limiting for auth endpoints to prevent brute force and account enumeration

-- ============================================================================
-- AUTH RATE LIMITS TABLE
-- Tracks failed login attempts per IP per endpoint
-- ============================================================================
CREATE TABLE auth_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address VARCHAR(45) NOT NULL, -- IPv6 max length
  endpoint VARCHAR(50) NOT NULL,   -- 'login', 'signup', 'verify-otp'
  request_count INT NOT NULL DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(ip_address, endpoint)
);

-- Index for fast lookups and cleanup
CREATE INDEX idx_auth_rate_limit_lookup ON auth_rate_limits(ip_address, endpoint);
CREATE INDEX idx_auth_rate_limit_reset ON auth_rate_limits(reset_at);

-- Updated_at trigger
CREATE TRIGGER update_auth_rate_limits_updated_at
  BEFORE UPDATE ON auth_rate_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CLEANUP FUNCTION: Remove expired rate limits
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_auth_rate_limits()
RETURNS INT AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM auth_rate_limits WHERE reset_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;