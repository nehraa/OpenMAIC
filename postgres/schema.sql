-- Full PostgreSQL Schema for Aidutech multi-tenant SaaS
-- Converted from SQLite schema with Row-Level Security

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TENANTS TABLE (Root tenant entity)
-- ============================================================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student_classroom')),
  phone_e164 TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone_e164);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_tenant ON users(tenant_id);

-- ============================================================================
-- AUTH SESSIONS
-- ============================================================================
CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  user_agent TEXT,
  ip_hash TEXT
);

CREATE INDEX idx_sessions_user ON auth_sessions(user_id);
CREATE INDEX idx_sessions_expires ON auth_sessions(expires_at);

-- ============================================================================
-- CLASSES TABLE
-- ============================================================================
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  teacher_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  batch TEXT NOT NULL DEFAULT '',
  join_code TEXT UNIQUE NOT NULL,
  peer_visibility_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_class_teacher ON classes(teacher_id);
CREATE INDEX idx_class_join_code ON classes(join_code);
CREATE INDEX idx_class_tenant ON classes(tenant_id);

-- ============================================================================
-- CLASS MEMBERSHIPS
-- ============================================================================
CREATE TABLE class_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'csv')),
  UNIQUE(class_id, student_id)
);

CREATE INDEX idx_membership_class ON class_memberships(class_id);
CREATE INDEX idx_membership_student ON class_memberships(student_id);
CREATE INDEX idx_membership_tenant ON class_memberships(tenant_id);

-- ============================================================================
-- CLASSROOM SESSIONS
-- ============================================================================
CREATE TABLE classroom_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL DEFAULT '',
  core_classroom_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'ended')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  max_duration_minutes INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_class ON classroom_sessions(class_id);
CREATE INDEX idx_session_status ON classroom_sessions(status);
CREATE INDEX idx_session_teacher ON classroom_sessions(teacher_id);
CREATE INDEX idx_session_tenant ON classroom_sessions(tenant_id);

-- ============================================================================
-- SESSION PARTICIPANTS
-- ============================================================================
CREATE TABLE session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  session_id UUID NOT NULL REFERENCES classroom_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  completion_state TEXT NOT NULL DEFAULT 'pending' CHECK (completion_state IN ('pending', 'completed')),
  UNIQUE(session_id, user_id)
);

CREATE INDEX idx_participants_session ON session_participants(session_id);
CREATE INDEX idx_participants_user ON session_participants(user_id);
CREATE INDEX idx_participants_tenant ON session_participants(tenant_id);

-- ============================================================================
-- QUESTION MESSAGES
-- ============================================================================
CREATE TABLE question_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  session_id UUID NOT NULL REFERENCES classroom_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id),
  question_text TEXT NOT NULL,
  answer_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  answered_at TIMESTAMPTZ
);

CREATE INDEX idx_questions_session ON question_messages(session_id);
CREATE INDEX idx_questions_student ON question_messages(student_id);
CREATE INDEX idx_questions_tenant ON question_messages(tenant_id);

-- ============================================================================
-- LLM USAGE EVENTS
-- ============================================================================
CREATE TABLE llm_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_user_id UUID NOT NULL REFERENCES users(id),
  actor_role TEXT NOT NULL CHECK (actor_role IN ('teacher', 'student_classroom', 'student_b2c')),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cached_tokens INTEGER NOT NULL DEFAULT 0,
  reasoning_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd REAL NOT NULL DEFAULT 0,
  request_id TEXT
);

CREATE INDEX idx_usage_timestamp ON llm_usage_events(timestamp);
CREATE INDEX idx_usage_actor ON llm_usage_events(actor_user_id);
CREATE INDEX idx_usage_role ON llm_usage_events(actor_role);
CREATE INDEX idx_usage_tenant ON llm_usage_events(tenant_id);

-- ============================================================================
-- CONTENT ASSETS (Phase 2)
-- ============================================================================
CREATE TABLE content_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  owner_teacher_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('slide_deck', 'quiz')),
  title TEXT NOT NULL DEFAULT '',
  subject_tag TEXT NOT NULL DEFAULT '',
  source_kind TEXT NOT NULL DEFAULT 'manual' CHECK (source_kind IN ('manual', 'ai_generated', 'imported')),
  source_ref TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_assets_owner ON content_assets(owner_teacher_id);
CREATE INDEX idx_content_assets_type ON content_assets(type);
CREATE INDEX idx_content_assets_tenant ON content_assets(tenant_id);

-- ============================================================================
-- CONTENT ASSET VERSIONS
-- ============================================================================
CREATE TABLE content_asset_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  asset_id UUID NOT NULL REFERENCES content_assets(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(asset_id, version_number)
);

CREATE INDEX idx_asset_versions_asset ON content_asset_versions(asset_id);
CREATE INDEX idx_asset_versions_tenant ON content_asset_versions(tenant_id);

-- ============================================================================
-- ASSIGNMENTS
-- ============================================================================
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  class_id UUID NOT NULL REFERENCES classes(id),
  teacher_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  slide_asset_version_id UUID REFERENCES content_asset_versions(id),
  quiz_asset_version_id UUID REFERENCES content_asset_versions(id),
  release_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'released', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assignments_teacher_status ON assignments(teacher_id, status);
CREATE INDEX idx_assignments_class_status ON assignments(class_id, status);
CREATE INDEX idx_assignments_tenant ON assignments(tenant_id);

-- ============================================================================
-- ASSIGNMENT RECIPIENTS
-- ============================================================================
CREATE TABLE assignment_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id),
  visibility_status TEXT NOT NULL DEFAULT 'hidden' CHECK (visibility_status IN ('hidden', 'visible', 'completed')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

CREATE INDEX idx_recipients_assignment ON assignment_recipients(assignment_id);
CREATE INDEX idx_recipients_student ON assignment_recipients(student_id);
CREATE INDEX idx_recipients_tenant ON assignment_recipients(tenant_id);

-- ============================================================================
-- ASSIGNMENT ATTEMPTS
-- ============================================================================
CREATE TABLE assignment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  score_percent REAL,
  answers_json TEXT,
  completion_state TEXT NOT NULL DEFAULT 'pending' CHECK (completion_state IN ('pending', 'in_progress', 'submitted', 'graded')),
  UNIQUE(assignment_id, student_id)
);

CREATE INDEX idx_attempts_assignment_student ON assignment_attempts(assignment_id, student_id);
CREATE INDEX idx_attempts_tenant ON assignment_attempts(tenant_id);

-- ============================================================================
-- ASSIGNMENT SLIDE PROGRESS
-- ============================================================================
CREATE TABLE assignment_slide_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id),
  slide_id TEXT NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(assignment_id, student_id, slide_id)
);

CREATE INDEX idx_slide_progress_assignment ON assignment_slide_progress(assignment_id);
CREATE INDEX idx_slide_progress_student ON assignment_slide_progress(student_id);
CREATE INDEX idx_slide_progress_tenant ON assignment_slide_progress(tenant_id);

-- ============================================================================
-- SCHEDULER JOBS
-- ============================================================================
CREATE TABLE scheduler_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('assignment', 'notification')),
  target_id TEXT NOT NULL,
  run_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scheduler_status_run_at ON scheduler_jobs(status, run_at);
CREATE INDEX idx_scheduler_tenant ON scheduler_jobs(tenant_id);

-- ============================================================================
-- LIVE SESSIONS
-- ============================================================================
CREATE TABLE live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  assignment_id UUID NOT NULL REFERENCES assignments(id),
  teacher_id UUID NOT NULL REFERENCES users(id),
  state_snapshot_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'ended')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_live_sessions_assignment ON live_sessions(assignment_id);
CREATE INDEX idx_live_sessions_teacher ON live_sessions(teacher_id);
CREATE INDEX idx_live_sessions_status ON live_sessions(status);
CREATE INDEX idx_live_sessions_tenant ON live_sessions(tenant_id);

-- ============================================================================
-- LIVE SESSION PARTICIPANTS
-- ============================================================================
CREATE TABLE live_session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  live_session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  completion_state TEXT NOT NULL DEFAULT 'pending' CHECK (completion_state IN ('pending', 'completed')),
  UNIQUE(live_session_id, user_id)
);

CREATE INDEX idx_live_participants_session ON live_session_participants(live_session_id);
CREATE INDEX idx_live_participants_user ON live_session_participants(user_id);
CREATE INDEX idx_live_participants_tenant ON live_session_participants(tenant_id);

-- ============================================================================
-- LIVE SESSION QUESTIONS
-- ============================================================================
CREATE TABLE live_session_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id),
  question_text TEXT NOT NULL,
  answer_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  answered_at TIMESTAMPTZ
);

CREATE INDEX idx_live_questions_session ON live_session_questions(session_id);
CREATE INDEX idx_live_questions_student ON live_session_questions(student_id);
CREATE INDEX idx_live_questions_tenant ON live_session_questions(tenant_id);

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_assets_updated_at
  BEFORE UPDATE ON content_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_live_sessions_updated_at
  BEFORE UPDATE ON live_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduler_jobs_updated_at
  BEFORE UPDATE ON scheduler_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();