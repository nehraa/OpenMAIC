-- Migration 011: durable teacher -> Core classroom generation jobs
--
-- Next.js compiles the POST and status handlers into separate route modules.
-- An in-memory Map therefore loses jobs between the two handlers and on any
-- service restart. Persisting the handoff makes status polling restart-safe.

CREATE TABLE IF NOT EXISTS teacher_classroom_generation_jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  class_id TEXT,
  core_job_id TEXT NOT NULL,
  core_poll_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completing', 'completed', 'failed')),
  poll_failures INTEGER NOT NULL DEFAULT 0,
  asset JSONB,
  fallback BOOLEAN NOT NULL DEFAULT FALSE,
  warning TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_classroom_jobs_owner_created
  ON teacher_classroom_generation_jobs (teacher_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_teacher_classroom_jobs_pending
  ON teacher_classroom_generation_jobs (status, updated_at)
  WHERE status IN ('pending', 'completing');
