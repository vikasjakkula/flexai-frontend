-- Add chapter column to questions table for chapter-wise quiz categorization
-- Chapter is populated by categorize-questions-chapters.js script using Gemini

ALTER TABLE questions ADD COLUMN IF NOT EXISTS chapter TEXT;

CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter);

COMMENT ON COLUMN questions.chapter IS 'EAPCET chapter name for chapter-wise quiz (e.g. Functions, Laws of Motion). Populated by AI categorization.';
