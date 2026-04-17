-- Add Botany and Zoology support for medical chapter-wise quizzes
-- Also add field column to distinguish engineering vs medical quizzes

-- 1. question_chapters: add Botany, Zoology to subject CHECK; add field column
ALTER TABLE question_chapters DROP CONSTRAINT IF EXISTS question_chapters_subject_check;
ALTER TABLE question_chapters ADD CONSTRAINT question_chapters_subject_check
  CHECK (subject IN ('Mathematics', 'Physics', 'Chemistry', 'Botany', 'Zoology'));

ALTER TABLE question_chapters ADD COLUMN IF NOT EXISTS field TEXT CHECK (field IN ('engineering', 'medical'));
-- Backfill existing rows as engineering
UPDATE question_chapters SET field = 'engineering' WHERE field IS NULL;

-- 2. quizzes: add Botany, Zoology to subject CHECK; add field column
ALTER TABLE quizzes DROP CONSTRAINT IF EXISTS quizzes_subject_check;
ALTER TABLE quizzes ADD CONSTRAINT quizzes_subject_check
  CHECK (subject IN ('Mathematics', 'Physics', 'Chemistry', 'Botany', 'Zoology'));

ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS field TEXT CHECK (field IN ('engineering', 'medical'));
-- Backfill existing rows as engineering
UPDATE quizzes SET field = 'engineering' WHERE field IS NULL;
