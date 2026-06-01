-- Migration 005: RLS for student_progress_events
-- The table was added in 004 but the RLS policy was missing from 002.

ALTER TABLE student_progress_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress_events FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_student_progress_events ON student_progress_events
  FOR ALL
  USING (tenant_id = get_current_tenant_id());
