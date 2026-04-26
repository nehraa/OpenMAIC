-- LLM Usage Events table for tracking token usage
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

CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON llm_usage_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_usage_actor ON llm_usage_events(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_usage_role ON llm_usage_events(actor_role);