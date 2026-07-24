-- Migration 012: reconcile llm_usage_events with the live text-ID schema.
--
-- Some installations created llm_usage_events from the app migrations rather
-- than 001_initial_schema.sql. Those tables lack tenant/analytics columns,
-- while the application already writes them. Add and backfill the columns in
-- a restart-safe way.

ALTER TABLE llm_usage_events
  ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id),
  ADD COLUMN IF NOT EXISTS class_id TEXT REFERENCES classes(id),
  ADD COLUMN IF NOT EXISTS session_id TEXT,
  ADD COLUMN IF NOT EXISTS feature TEXT;

UPDATE llm_usage_events AS usage
SET tenant_id = users.tenant_id
FROM users
WHERE usage.actor_user_id = users.id
  AND usage.tenant_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM llm_usage_events WHERE tenant_id IS NULL) THEN
    ALTER TABLE llm_usage_events ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_usage_tenant ON llm_usage_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_class ON llm_usage_events(class_id);
CREATE INDEX IF NOT EXISTS idx_usage_session ON llm_usage_events(session_id);
CREATE INDEX IF NOT EXISTS idx_usage_feature ON llm_usage_events(feature);