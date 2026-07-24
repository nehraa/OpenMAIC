-- Migration 015: Create student_progress_events table.
--
-- Migration 005 set up RLS for this table and the comment said it was
-- "added in 004", but the actual CREATE TABLE statement is missing from
-- the migration set. The teacher progress/student/[studentId] endpoint
-- queries this table and 500s because the relation does not exist.
--
-- The 005 RLS policy already exists, so we only need the table itself.

CREATE TABLE IF NOT EXISTS student_progress_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  related_id TEXT,
  score NUMERIC,
  duration_seconds INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_progress_events_student
  ON student_progress_events (student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_progress_events_class
  ON student_progress_events (class_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_progress_events_tenant
  ON student_progress_events (tenant_id);
