-- Student App Read-Only Reference Schema
-- Students connect via Row-Level Security (RLS) policies enforced by the API layer.
-- This schema documents the tables and columns students can access.

-- ============================================================================
-- TABLES STUDENTS CAN READ (SELECT)
-- ============================================================================

-- Users table - students can only view their own profile
-- Accessible columns: id, role, phone_e164, name, status, created_at, updated_at
-- RLS: WHERE id = current_setting('app.current_user_id')::text
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student_classroom')),
  phone_e164 TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Classes - students can view classes they are members of
-- Accessible columns: id, teacher_id, name, subject, batch, join_code, peer_visibility_enabled, created_at, updated_at
-- RLS: WHERE id IN (SELECT class_id FROM class_memberships WHERE student_id = current_setting('app.current_user_id')::text)
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  teacher_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  batch TEXT NOT NULL DEFAULT '',
  join_code TEXT UNIQUE NOT NULL,
  peer_visibility_enabled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Class memberships - students can view their own enrollments
-- Accessible columns: id, class_id, student_id, enrolled_at, source
-- RLS: WHERE student_id = current_setting('app.current_user_id')::text
CREATE TABLE IF NOT EXISTS class_memberships (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  class_id TEXT NOT NULL REFERENCES classes(id),
  student_id TEXT NOT NULL REFERENCES users(id),
  enrolled_at TEXT NOT NULL DEFAULT (datetime('now')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'csv'))
);

-- Classroom sessions - students can view live/ended sessions for their classes
-- Accessible columns: id, class_id, teacher_id, title, core_classroom_id, status, started_at, ended_at, max_duration_minutes, created_at
-- RLS: WHERE class_id IN (SELECT class_id FROM class_memberships WHERE student_id = current_setting('app.current_user_id')::text)
CREATE TABLE IF NOT EXISTS classroom_sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  class_id TEXT NOT NULL REFERENCES classes(id),
  teacher_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL DEFAULT '',
  core_classroom_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'ended')),
  started_at TEXT,
  ended_at TEXT,
  max_duration_minutes INTEGER NOT NULL DEFAULT 15,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Session participants - students can view/update their own completion state
-- Accessible columns: id, session_id, user_id, joined_at, left_at, completion_state
-- RLS (SELECT): WHERE user_id = current_setting('app.current_user_id')::text
-- RLS (UPDATE): WHERE user_id = current_setting('app.current_user_id')::text AND completion_state = 'pending'
CREATE TABLE IF NOT EXISTS session_participants (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  session_id TEXT NOT NULL REFERENCES classroom_sessions(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  left_at TEXT,
  completion_state TEXT NOT NULL DEFAULT 'pending' CHECK (completion_state IN ('pending', 'completed'))
);

-- Question messages - students can INSERT and SELECT their own questions
-- Accessible columns: id, session_id, student_id, question_text, answer_text, created_at, answered_at
-- RLS (SELECT): WHERE student_id = current_setting('app.current_user_id')::text
-- RLS (INSERT): student_id = current_setting('app.current_user_id')::text
CREATE TABLE IF NOT EXISTS question_messages (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  session_id TEXT NOT NULL REFERENCES classroom_sessions(id),
  student_id TEXT NOT NULL REFERENCES users(id),
  question_text TEXT NOT NULL,
  answer_text TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  answered_at TEXT
);

-- ============================================================================
-- TABLES STUDENTS CANNOT ACCESS DIRECTLY
-- ============================================================================

-- Auth sessions - students authenticate via the API, sessions managed server-side
-- NO direct student access
CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issued_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  user_agent TEXT,
  ip_hash TEXT
);

-- LLM usage events - tracked at system level, not student-visible
-- NO direct student access
CREATE TABLE IF NOT EXISTS llm_usage_events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  actor_user_id TEXT NOT NULL REFERENCES users(id),
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

-- ============================================================================
-- INDEXES (for query optimization)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_e164);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_class_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_join_code ON classes(join_code);
CREATE INDEX IF NOT EXISTS idx_membership_class ON class_memberships(class_id);
CREATE INDEX IF NOT EXISTS idx_membership_student ON class_memberships(student_id);
CREATE INDEX IF NOT EXISTS idx_session_class ON classroom_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_session_status ON classroom_sessions(status);
CREATE INDEX IF NOT EXISTS idx_participants_session ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_session ON question_messages(session_id);
