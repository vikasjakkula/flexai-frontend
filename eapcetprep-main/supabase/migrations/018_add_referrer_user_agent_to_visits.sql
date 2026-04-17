-- Add missing referrer and user_agent columns to affiliate_visits table
-- These columns are needed for the middleware to record visit details

ALTER TABLE affiliate_visits 
ADD COLUMN IF NOT EXISTS referrer TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Add index on user_id if it doesn't exist (for faster lookups during payment processing)
CREATE INDEX IF NOT EXISTS idx_affiliate_visits_user_id ON affiliate_visits(user_id);

-- Add index on created_at if it doesn't exist (for faster sorting)
CREATE INDEX IF NOT EXISTS idx_affiliate_visits_created_at ON affiliate_visits(created_at);

-- Add comment to explain the columns
COMMENT ON COLUMN affiliate_visits.referrer IS 'HTTP referer header from the visit';
COMMENT ON COLUMN affiliate_visits.user_agent IS 'User agent string from the visit';
















