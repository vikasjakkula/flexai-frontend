-- question_chapters: optimized lookup for "10 random questions from chapter X in subject Y"
-- Populated by scripts/populate-question-chapters.js from questions where chapter IS NOT NULL

CREATE TABLE IF NOT EXISTS question_chapters (
  question_id INTEGER NOT NULL,
  section_id TEXT NOT NULL,
  subject TEXT NOT NULL CHECK (subject IN ('Mathematics', 'Physics', 'Chemistry')),
  chapter TEXT NOT NULL,
  PRIMARY KEY (question_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_question_chapters_subject_chapter ON question_chapters(subject, chapter);

COMMENT ON TABLE question_chapters IS 'Lookup table for chapter-wise quiz: subject + chapter -> question_ids. Enables fast random sampling.';
