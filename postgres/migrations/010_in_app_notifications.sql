-- Migration 010: In-app notifications on assignment release
--
-- The releaseAssignment flow needs a way to tell students a new assignment
-- landed in their class. There is no email/SMTP integration in this repo,
-- so the v1 hook is an in-app feed: every recipient gets one row per release.
-- Email/SMS can later be added by adding an outbound transport that reads
-- rows from this same table.
--
-- Also adds the late-grading close notification (assignment_closed).

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('assignment_released', 'assignment_closed', 'grade_available')),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_student_unread
  ON notifications (student_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_assignment
  ON notifications (assignment_id);