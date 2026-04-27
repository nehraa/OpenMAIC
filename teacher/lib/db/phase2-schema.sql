-- Phase 2: Assignment Domain Schema

-- Content assets (slide decks and quizzes)
CREATE TABLE IF NOT EXISTS content_assets (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  owner_teacher_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('slide_deck', 'quiz')),
  title TEXT NOT NULL DEFAULT '',
  subject_tag TEXT NOT NULL DEFAULT '',
  source_kind TEXT NOT NULL DEFAULT 'manual' CHECK (source_kind IN ('manual', 'ai_generated', 'imported')),
  source_ref TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Content asset versions for versioning
CREATE TABLE IF NOT EXISTS content_asset_versions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  asset_id TEXT NOT NULL REFERENCES content_assets(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(asset_id, version_number)
);

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  class_id TEXT NOT NULL REFERENCES classes(id),
  teacher_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  slide_asset_version_id TEXT REFERENCES content_asset_versions(id),
  quiz_asset_version_id TEXT REFERENCES content_asset_versions(id),
  release_at TEXT,
  due_at TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'released', 'closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Assignment recipients (which students receive which assignment)
CREATE TABLE IF NOT EXISTS assignment_recipients (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users(id),
  visibility_status TEXT NOT NULL DEFAULT 'hidden' CHECK (visibility_status IN ('hidden', 'visible', 'completed')),
  assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(assignment_id, student_id)
);

-- Assignment attempts (student submissions)
CREATE TABLE IF NOT EXISTS assignment_attempts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users(id),
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  submitted_at TEXT,
  score_percent REAL,
  completion_state TEXT NOT NULL DEFAULT 'pending' CHECK (completion_state IN ('pending', 'in_progress', 'submitted', 'graded')),
  UNIQUE(assignment_id, student_id)
);

-- Assignment slide progress (tracking which slides a student has viewed)
CREATE TABLE IF NOT EXISTS assignment_slide_progress (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users(id),
  slide_id TEXT NOT NULL,
  viewed_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(assignment_id, student_id, slide_id)
);

-- Scheduler jobs for delayed/release tasks
CREATE TABLE IF NOT EXISTS scheduler_jobs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  target_type TEXT NOT NULL CHECK (target_type IN ('assignment', 'notification')),
  target_id TEXT NOT NULL,
  run_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for assignments
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_status ON assignments(teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_assignments_class_status ON assignments(class_id, status);

-- Indexes for assignment_recipients
CREATE INDEX IF NOT EXISTS idx_recipients_assignment ON assignment_recipients(assignment_id);
CREATE INDEX IF NOT EXISTS idx_recipients_student ON assignment_recipients(student_id);

-- Indexes for assignment_attempts
CREATE INDEX IF NOT EXISTS idx_attempts_assignment_student ON assignment_attempts(assignment_id, student_id);

-- Indexes for scheduler_jobs
CREATE INDEX IF NOT EXISTS idx_scheduler_status_run_at ON scheduler_jobs(status, run_at);

-- Quiz domain tables
-- Quiz content assets are stored in content_assets with type='quiz'
-- Quiz content asset versions are stored in content_asset_versions

-- Quiz questions stored as JSON in content_asset_versions.payload_json
-- This avoids a separate table since questions are embedded in the version payload
-- Structure in payload_json: { "questions": [{ "type": "mcq"|"short_answer", ... }] }

-- Live sessions for real-time slide/presentation sessions
CREATE TABLE IF NOT EXISTS live_sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  assignment_id TEXT NOT NULL REFERENCES assignments(id),
  teacher_id TEXT NOT NULL REFERENCES users(id),
  state_snapshot_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'ended')),
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Live session participants (students who joined)
CREATE TABLE IF NOT EXISTS live_session_participants (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  live_session_id TEXT NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  left_at TEXT,
  completion_state TEXT NOT NULL DEFAULT 'pending' CHECK (completion_state IN ('pending', 'completed')),
  UNIQUE(live_session_id, user_id)
);

-- Indexes for live_sessions
CREATE INDEX IF NOT EXISTS idx_live_sessions_assignment ON live_sessions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_teacher ON live_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON live_sessions(status);

-- Indexes for live_session_participants
CREATE INDEX IF NOT EXISTS idx_live_participants_session ON live_session_participants(live_session_id);
CREATE INDEX IF NOT EXISTS idx_live_participants_user ON live_session_participants(user_id);

-- Live session questions (students asking questions during live sessions)
CREATE TABLE IF NOT EXISTS live_session_questions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  session_id TEXT NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users(id),
  question_text TEXT NOT NULL,
  answer_text TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  answered_at TEXT
);

-- Indexes for live_session_questions
CREATE INDEX IF NOT EXISTS idx_live_questions_session ON live_session_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_live_questions_student ON live_session_questions(student_id);
