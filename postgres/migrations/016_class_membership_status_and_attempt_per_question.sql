-- Migration 016: class_memberships.status + assignment_attempts.per_question_json
--
-- Two related fixes for the 2026-07-24 tracker:
--
-- 1. Bug #4 (join approval) and Bug #12 (kick/restrict). The original
--    class_memberships table tracked only the join itself, with no membership
--    state. We need a status column so the teacher can approve new joiners
--    before they gain access, and so a restricted student can stay in the
--    class roster without being deleted.
--
--    New status values:
--      pending    — student submitted a join code, teacher hasn't approved
--      active     — student has full access (default for backward compat)
--      rejected   — teacher explicitly denied the join
--      restricted — student is in the class but has limited access (e.g.,
--                   read-only, blocked from new assignment submissions)
--
-- 2. Bug #14 (weakness profile). Per-question grader results were dropped at
--    submit time. Persist them on assignment_attempts so the teacher progress
--    endpoint can aggregate by question type and surface real weaknesses.
--    Old rows default to NULL and continue to work.

ALTER TABLE class_memberships
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending', 'active', 'rejected', 'restricted'));

CREATE INDEX IF NOT EXISTS idx_membership_status
  ON class_memberships (class_id, status);

ALTER TABLE assignment_attempts
  ADD COLUMN IF NOT EXISTS per_question_json JSONB;
