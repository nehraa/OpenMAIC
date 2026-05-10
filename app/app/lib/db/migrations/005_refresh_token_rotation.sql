-- Migration 005: Add refresh token tracking columns for rotation and replay detection
-- This enables secure refresh token rotation with family-based invalidation

ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS refresh_token_hash TEXT;
ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS token_family UUID DEFAULT gen_random_uuid();
ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS is_revoked BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;
ALTER TABLE auth_sessions ADD COLUMN IF NOT EXISTS replaced_by TEXT REFERENCES auth_sessions(id);

-- Index for quick session lookup by refresh token hash
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token_hash ON auth_sessions(refresh_token_hash) WHERE refresh_token_hash IS NOT NULL;

-- Index for finding all sessions in a token family (for revocation cascade)
CREATE INDEX IF NOT EXISTS idx_sessions_token_family ON auth_sessions(token_family);
