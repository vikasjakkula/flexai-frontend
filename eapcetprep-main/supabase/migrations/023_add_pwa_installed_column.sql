-- Add pwa_installed column to users table
-- This tracks whether the user has installed the PWA, which is required for free tests

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS pwa_installed BOOLEAN DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN users.pwa_installed IS 'Whether the user has installed the Progressive Web App. Required for accessing free tests.';

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_pwa_installed ON users(pwa_installed);








