-- Improve existing tables with missing columns and indexes

-- Add missing columns to tests table
ALTER TABLE tests 
ADD COLUMN IF NOT EXISTS test_type TEXT CHECK (test_type IN ('previous_year', 'mock')) DEFAULT 'previous_year',
ADD COLUMN IF NOT EXISTS year VARCHAR(4),
ADD COLUMN IF NOT EXISTS set_name VARCHAR(10),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add indexes to tests table
CREATE INDEX IF NOT EXISTS idx_tests_type ON tests(test_type);
CREATE INDEX IF NOT EXISTS idx_tests_year ON tests(year);
CREATE INDEX IF NOT EXISTS idx_tests_date ON tests(test_date DESC);

-- Add indexes to questions table
CREATE INDEX IF NOT EXISTS idx_questions_section_id ON questions(section_id);
CREATE INDEX IF NOT EXISTS idx_questions_test_id ON questions(question_id, section_id);

-- Add indexes to sections table
CREATE INDEX IF NOT EXISTS idx_sections_test_id ON sections(test_id);

-- Add indexes to users table
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_premium ON users(is_premium);

-- Add updated_at to users table if not exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add function to update users updated_at
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for users updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- Ensure sections have proper foreign key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'sections_test_id_fkey'
  ) THEN
    ALTER TABLE sections 
    ADD CONSTRAINT sections_test_id_fkey 
    FOREIGN KEY (test_id) REFERENCES tests(test_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure questions have proper foreign key to sections
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'questions_section_id_fkey'
  ) THEN
    ALTER TABLE questions 
    ADD CONSTRAINT questions_section_id_fkey 
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE CASCADE;
  END IF;
END $$;

