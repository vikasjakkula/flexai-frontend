-- Fix quiz_attempts: drop auth.users FK, use app's own users table instead
ALTER TABLE quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_user_id_fkey;
ALTER TABLE quiz_attempts ADD CONSTRAINT quiz_attempts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Also disable RLS since the app uses service role key for all DB access
ALTER TABLE quiz_attempts DISABLE ROW LEVEL SECURITY;
