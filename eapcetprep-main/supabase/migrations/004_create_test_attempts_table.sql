-- Create test_attempts table for saving test progress and allowing resume
CREATE TABLE IF NOT EXISTS test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_id INTEGER NOT NULL REFERENCES tests(test_id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'submitted', 'abandoned')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  time_remaining INTEGER NOT NULL, -- seconds remaining
  current_question_id INTEGER NOT NULL DEFAULT 1,
  answers JSONB NOT NULL DEFAULT '{}', -- {question_number: "selected_option"}
  marked_for_review INTEGER[] DEFAULT '{}', -- array of question numbers
  answered_and_marked INTEGER[] DEFAULT '{}', -- array of question numbers
  visited_questions INTEGER[] DEFAULT '{}', -- array of question numbers
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure only one in_progress attempt per user per test
  CONSTRAINT unique_in_progress_attempt UNIQUE(user_id, test_id, status) 
    DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_test ON test_attempts(user_id, test_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_status ON test_attempts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_test_attempts_status ON test_attempts(status);
CREATE INDEX IF NOT EXISTS idx_test_attempts_test_id ON test_attempts(test_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_test_attempts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_test_attempts_updated_at
  BEFORE UPDATE ON test_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_test_attempts_updated_at();

-- Disable RLS - using custom JWT auth at application level
-- Auth is handled by requireAuth() in API routes using service role key
ALTER TABLE test_attempts DISABLE ROW LEVEL SECURITY;

