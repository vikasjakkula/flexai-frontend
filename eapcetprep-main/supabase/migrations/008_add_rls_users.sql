-- Disable RLS - using custom JWT auth at application level
-- Auth is handled by requireAuth() in API routes using service role key
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

