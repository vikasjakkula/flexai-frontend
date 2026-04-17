-- quizzes: chapter-wise quizzes, 5 questions each, up to 30 per chapter
-- One row per question in a quiz (5 rows per quiz)

CREATE TABLE IF NOT EXISTS quizzes (
  quiz_id UUID NOT NULL DEFAULT gen_random_uuid(),
  quiz_name TEXT NOT NULL,
  subject TEXT NOT NULL CHECK (subject IN ('Mathematics', 'Physics', 'Chemistry')),
  chapter TEXT NOT NULL,
  question_id INTEGER NOT NULL,
  section_id TEXT NOT NULL,
  question_order INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (quiz_id, question_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_quizzes_subject_chapter ON quizzes(subject, chapter);
CREATE INDEX IF NOT EXISTS idx_quizzes_quiz_id ON quizzes(quiz_id);

COMMENT ON TABLE quizzes IS 'Chapter-wise quizzes: 5 questions per quiz, up to 30 quizzes per chapter. Populated by scripts/populate-quizzes.js';
