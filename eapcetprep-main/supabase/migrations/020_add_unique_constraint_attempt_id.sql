-- Add unique constraint on attempt_id in test_results to prevent duplicate submissions
-- This ensures one result per attempt, preventing race condition issues

ALTER TABLE test_results 
ADD CONSTRAINT unique_attempt_result UNIQUE (attempt_id);











