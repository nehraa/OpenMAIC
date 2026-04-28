-- Add email column to users table for password-based auth
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE NOT NULL;

-- Add password_hash column for password-based authentication
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create tenants table for multi-tenancy
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  owner_user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'personal' CHECK (type IN ('personal', 'team')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tenants_owner ON tenants(owner_user_id);