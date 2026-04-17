-- Add exam_type and current_marks columns to users table
-- These fields store the exam type (TS EAPCET/AP EAPCET) and current marks range from onboarding

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS exam_type TEXT,
ADD COLUMN IF NOT EXISTS current_marks TEXT;

-- Add comments to explain these fields
COMMENT ON COLUMN users.exam_type IS 'Exam type the user is preparing for: TS EAPCET or AP EAPCET';
COMMENT ON COLUMN users.current_marks IS 'Current marks range selected during onboarding: less than 40, 40-60, 60-80, 80-120, or 120+';








