-- Create test_results table for storing completed test results
CREATE TABLE IF NOT EXISTS test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_id INTEGER NOT NULL REFERENCES tests(test_id) ON DELETE CASCADE,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  time_taken INTEGER NOT NULL, -- seconds taken to complete
  answers JSONB NOT NULL, -- {question_number: "selected_option"}
  section_wise_marks JSONB NOT NULL, -- {"maths": 60, "physics": 35, "chemistry": 30}
  total_marks INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  wrong_answers INTEGER NOT NULL,
  unattempted INTEGER NOT NULL,
  section_wise_analysis JSONB NOT NULL, -- detailed analysis per section
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_test_results_user_test ON test_results(user_id, test_id);
CREATE INDEX IF NOT EXISTS idx_test_results_submitted_at ON test_results(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_results_attempt_id ON test_results(attempt_id);

-- Disable RLS - using custom JWT auth at application level
-- Auth is handled by requireAuth() in API routes using service role key
ALTER TABLE test_results DISABLE ROW LEVEL SECURITY;

