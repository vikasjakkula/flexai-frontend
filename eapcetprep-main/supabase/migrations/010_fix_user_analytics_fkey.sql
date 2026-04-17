-- Fix user_analytics foreign key to reference users table instead of auth.users
-- Drop existing foreign key constraint if it exists
ALTER TABLE user_analytics 
DROP CONSTRAINT IF EXISTS user_analytics_user_id_fkey;

-- Add correct foreign key constraint to users table
ALTER TABLE user_analytics
ADD CONSTRAINT user_analytics_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

