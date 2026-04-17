-- Add affiliate_id column to users table
-- This stores the affiliate who referred the user during signup

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES affiliates(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_affiliate_id ON users(affiliate_id);

-- Add comment to explain the column
COMMENT ON COLUMN users.affiliate_id IS 'The affiliate who referred this user during signup. Stored from cookie during registration.';




