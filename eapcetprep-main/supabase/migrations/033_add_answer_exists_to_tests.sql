-- Add answer_exists to tests: when true, test has answer key / is valid for attempting
ALTER TABLE tests
ADD COLUMN IF NOT EXISTS answer_exists BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN tests.answer_exists IS 'When true, this test has answers (e.g. correct_option set) and is valid for attempting. Used to filter tests for demo seed and attempt listing.';
