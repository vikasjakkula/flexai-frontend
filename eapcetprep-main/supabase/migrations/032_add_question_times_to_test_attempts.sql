-- Add question_times JSONB to test_attempts for per-question time tracking
-- Keys: question_number (as string), values: time_spent_seconds
ALTER TABLE test_attempts
ADD COLUMN IF NOT EXISTS question_times JSONB DEFAULT '{}';

COMMENT ON COLUMN test_attempts.question_times IS 'Per-question time spent in seconds: { "1": 65, "2": 72, ... }';
