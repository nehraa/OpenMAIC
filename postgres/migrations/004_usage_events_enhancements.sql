-- Migration 004: Enhance llm_usage_events for analytics dashboard
-- Adds class_id, session_id, and feature columns for richer analytics

ALTER TABLE llm_usage_events
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id),
  ADD COLUMN IF NOT EXISTS session_id UUID,
  ADD COLUMN IF NOT EXISTS feature TEXT;

-- feature values: 'slide_generation' | 'quiz_generation' | 'classroom' | 'qa' | 'pbl_chat' | 'quiz_grade' | 'scene_generation'

CREATE INDEX IF NOT EXISTS idx_usage_class ON llm_usage_events(class_id);
CREATE INDEX IF NOT EXISTS idx_usage_session ON llm_usage_events(session_id);
CREATE INDEX IF NOT EXISTS idx_usage_feature ON llm_usage_events(feature);
