-- Migration: 007_student_profiles
-- Creates student_profiles table for tracking student personality, learning style, strengths, and weaknesses

CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  personality_notes TEXT,
  learning_style VARCHAR(50), -- 'visual', 'auditory', 'kinesthetic', 'reading', 'mixed'
  strengths TEXT[], -- array of strength tags
  weaknesses TEXT[], -- array of weakness/area-for-improvement tags
  recommended_topics TEXT[], -- topics student should focus on based on past performance
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast student lookup
CREATE INDEX IF NOT EXISTS idx_student_profiles_student_id ON student_profiles(student_id);

-- Comments for documentation
COMMENT ON TABLE student_profiles IS 'Stores AI-inferred and teacher-documented student learning profiles for personalized teaching';
COMMENT ON COLUMN student_profiles.recommended_topics IS 'Topics student should focus on based on quiz performance and grade analysis';

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_student_profiles_updated_at ON student_profiles;
CREATE TRIGGER update_student_profiles_updated_at
  BEFORE UPDATE ON student_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
