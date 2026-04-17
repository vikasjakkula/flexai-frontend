-- Add trial support: 15-min trial attempts with 5 questions per subject
ALTER TABLE test_attempts
  ADD COLUMN IF NOT EXISTS is_trial BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_question_ids JSONB;

COMMENT ON COLUMN test_attempts.is_trial IS 'True for 15-min trial (5 Q per subject from selected test)';
COMMENT ON COLUMN test_attempts.trial_question_ids IS 'Array of question_id for trial subset when is_trial=true';

ALTER TABLE test_results
  ADD COLUMN IF NOT EXISTS is_trial BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN test_results.is_trial IS 'True when result is from a trial attempt (show paywall after)';
