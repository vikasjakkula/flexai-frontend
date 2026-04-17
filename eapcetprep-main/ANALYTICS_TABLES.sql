-- =====================================================
-- ANALYTICS SYSTEM - COMPLETE SQL SCHEMA
-- =====================================================
-- This file contains all SQL needed to create/update
-- tables for the analytics and time tracking system
-- =====================================================

-- 1. Create attempt_question_times table for tracking time spent per question
CREATE TABLE IF NOT EXISTS attempt_question_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(attempt_id, question_number)
);

-- Create indexes for attempt_question_times
CREATE INDEX IF NOT EXISTS idx_attempt_question_times_attempt_id ON attempt_question_times(attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_question_times_question_number ON attempt_question_times(question_number);

-- 2. Create test_result_analytics table for storing pre-calculated analytics per test
CREATE TABLE IF NOT EXISTS test_result_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL UNIQUE REFERENCES test_attempts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_id INTEGER NOT NULL REFERENCES tests(test_id) ON DELETE CASCADE,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Overall metrics
  total_score INTEGER NOT NULL,
  total_marks INTEGER NOT NULL DEFAULT 160,
  correct_count INTEGER NOT NULL,
  wrong_count INTEGER NOT NULL,
  unattempted_count INTEGER NOT NULL,
  total_time_seconds INTEGER NOT NULL DEFAULT 0,
  
  -- Time by answer status
  time_correct_seconds INTEGER NOT NULL DEFAULT 0,
  time_wrong_seconds INTEGER NOT NULL DEFAULT 0,
  time_unattempted_seconds INTEGER NOT NULL DEFAULT 0,
  
  -- Subject-wise metrics
  maths_score DECIMAL(10, 2) NOT NULL DEFAULT 0,
  physics_score DECIMAL(10, 2) NOT NULL DEFAULT 0,
  chemistry_score DECIMAL(10, 2) NOT NULL DEFAULT 0,
  maths_time_seconds INTEGER NOT NULL DEFAULT 0,
  physics_time_seconds INTEGER NOT NULL DEFAULT 0,
  chemistry_time_seconds INTEGER NOT NULL DEFAULT 0,
  
  -- Calculated fields
  accuracy_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for test_result_analytics
CREATE INDEX IF NOT EXISTS idx_test_result_analytics_user_id ON test_result_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_test_result_analytics_test_id ON test_result_analytics(test_id);
CREATE INDEX IF NOT EXISTS idx_test_result_analytics_submitted_at ON test_result_analytics(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_result_analytics_attempt_id ON test_result_analytics(attempt_id);

-- 3. Create user_test_averages table for storing aggregated averages across all tests
CREATE TABLE IF NOT EXISTS user_test_averages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Overall averages
  avg_score DECIMAL(10, 2) NOT NULL DEFAULT 0,
  avg_total_marks DECIMAL(10, 2) NOT NULL DEFAULT 160,
  avg_correct_count DECIMAL(10, 2) NOT NULL DEFAULT 0,
  avg_wrong_count DECIMAL(10, 2) NOT NULL DEFAULT 0,
  avg_unattempted_count DECIMAL(10, 2) NOT NULL DEFAULT 0,
  avg_total_time_seconds DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Average time by answer status
  avg_time_correct_seconds DECIMAL(10, 2) NOT NULL DEFAULT 0,
  avg_time_wrong_seconds DECIMAL(10, 2) NOT NULL DEFAULT 0,
  avg_time_unattempted_seconds DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Subject-wise averages
  avg_maths_score DECIMAL(10, 2) NOT NULL DEFAULT 0,
  avg_physics_score DECIMAL(10, 2) NOT NULL DEFAULT 0,
  avg_chemistry_score DECIMAL(10, 2) NOT NULL DEFAULT 0,
  avg_maths_time_seconds DECIMAL(10, 2) NOT NULL DEFAULT 0,
  avg_physics_time_seconds DECIMAL(10, 2) NOT NULL DEFAULT 0,
  avg_chemistry_time_seconds DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Calculated averages
  avg_accuracy_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
  total_tests_taken INTEGER NOT NULL DEFAULT 0,
  
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user_test_averages
CREATE INDEX IF NOT EXISTS idx_user_test_averages_user_id ON user_test_averages(user_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp for test_result_analytics
CREATE OR REPLACE FUNCTION update_test_result_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at for test_result_analytics
DROP TRIGGER IF EXISTS update_test_result_analytics_updated_at ON test_result_analytics;
CREATE TRIGGER update_test_result_analytics_updated_at
  BEFORE UPDATE ON test_result_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_test_result_analytics_updated_at();

-- Function to update last_updated_at timestamp for attempt_question_times
CREATE OR REPLACE FUNCTION update_attempt_question_times_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update last_updated_at for attempt_question_times
DROP TRIGGER IF EXISTS update_attempt_question_times_updated_at ON attempt_question_times;
CREATE TRIGGER update_attempt_question_times_updated_at
  BEFORE UPDATE ON attempt_question_times
  FOR EACH ROW
  EXECUTE FUNCTION update_attempt_question_times_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
-- Disable RLS - using custom JWT auth at application level
-- Auth is handled by requireAuth() in API routes using service role key
ALTER TABLE attempt_question_times DISABLE ROW LEVEL SECURITY;
ALTER TABLE test_result_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_test_averages DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE attempt_question_times IS 'Tracks time spent on each question during a test attempt. Time is accumulated even if user navigates away and comes back.';
COMMENT ON TABLE test_result_analytics IS 'Pre-calculated analytics for each submitted test. Contains per-test metrics including scores, times, and subject-wise breakdowns.';
COMMENT ON TABLE user_test_averages IS 'Aggregated averages across all tests for a user. Updated automatically when a new test is submitted.';

COMMENT ON COLUMN attempt_question_times.time_spent_seconds IS 'Total accumulated time in seconds spent on this question across all visits.';
COMMENT ON COLUMN test_result_analytics.total_score IS 'Total marks obtained (EAMCET: +1 for correct, -0.25 for wrong)';
COMMENT ON COLUMN test_result_analytics.time_correct_seconds IS 'Total time spent on questions that were answered correctly';
COMMENT ON COLUMN test_result_analytics.time_wrong_seconds IS 'Total time spent on questions that were answered incorrectly';
COMMENT ON COLUMN test_result_analytics.time_unattempted_seconds IS 'Total time spent on questions that were not attempted';
COMMENT ON COLUMN user_test_averages.avg_score IS 'Average score across all submitted tests';
COMMENT ON COLUMN user_test_averages.total_tests_taken IS 'Total number of tests submitted by the user';














