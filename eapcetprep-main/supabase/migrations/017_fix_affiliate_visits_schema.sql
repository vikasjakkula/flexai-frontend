-- Fix affiliate_visits table schema to match what middleware is trying to insert

-- Add missing columns to affiliate_visits
ALTER TABLE affiliate_visits 
ADD COLUMN IF NOT EXISTS referrer TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- If first_visited_at exists but created_at doesn't, we can use first_visited_at as created_at
-- But it's better to have both for clarity
-- Update created_at from first_visited_at if created_at is null
UPDATE affiliate_visits 
SET created_at = first_visited_at 
WHERE created_at IS NULL AND first_visited_at IS NOT NULL;

-- Add index on created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_affiliate_visits_created_at ON affiliate_visits(created_at);

-- Add index on user_id for faster lookups during payment processing
CREATE INDEX IF NOT EXISTS idx_affiliate_visits_user_id ON affiliate_visits(user_id);
















