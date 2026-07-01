-- Migration 009: auth_sessions.refresh_token_hash
-- The app login route (app/app/api/auth/login/route.ts) hashes the refresh
-- token and stores it alongside the session for rotation support. The column
-- was added to the code but no migration created it, so password login
-- returned 500 "column does not exist". Adding it now to make the route work.
ALTER TABLE auth_sessions
  ADD COLUMN IF NOT EXISTS refresh_token_hash TEXT;
