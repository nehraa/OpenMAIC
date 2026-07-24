-- Migration 013: reconcile assignment tables created by the early phase-2
-- schema with the tenant-aware teacher/student application code.

ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id);

UPDATE assignments AS assignment
SET tenant_id = classes.tenant_id
FROM classes
WHERE assignment.class_id = classes.id
  AND assignment.tenant_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM assignments WHERE tenant_id IS NULL) THEN
    ALTER TABLE assignments ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

ALTER TABLE assignment_recipients
  ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id);

UPDATE assignment_recipients AS recipient
SET tenant_id = assignment.tenant_id
FROM assignments AS assignment
WHERE recipient.assignment_id = assignment.id
  AND recipient.tenant_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM assignment_recipients WHERE tenant_id IS NULL) THEN
    ALTER TABLE assignment_recipients ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

ALTER TABLE assignment_attempts
  ADD COLUMN IF NOT EXISTS tenant_id TEXT REFERENCES tenants(id);

UPDATE assignment_attempts AS attempt
SET tenant_id = assignment.tenant_id
FROM assignments AS assignment
WHERE attempt.assignment_id = assignment.id
  AND attempt.tenant_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM assignment_attempts WHERE tenant_id IS NULL) THEN
    ALTER TABLE assignment_attempts ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

-- Early phase-2 tables stored dates as text. The runtime compares due_at to
-- NOW(), so use proper timestamps.
ALTER TABLE assignments
  ALTER COLUMN release_at TYPE TIMESTAMPTZ
    USING NULLIF(release_at::text, '')::timestamptz,
  ALTER COLUMN due_at TYPE TIMESTAMPTZ
    USING NULLIF(due_at::text, '')::timestamptz;

ALTER TABLE assignment_attempts
  ALTER COLUMN submitted_at TYPE TIMESTAMPTZ
    USING NULLIF(submitted_at::text, '')::timestamptz;

CREATE INDEX IF NOT EXISTS idx_assignments_tenant ON assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assignment_recipients_tenant ON assignment_recipients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assignment_attempts_tenant ON assignment_attempts(tenant_id);