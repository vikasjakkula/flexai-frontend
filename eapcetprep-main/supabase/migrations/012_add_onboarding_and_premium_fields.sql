-- Add onboarding fields and premium validity to users table

-- Add onboarding fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS year_of_study VARCHAR(50),
ADD COLUMN IF NOT EXISTS target_year VARCHAR(10),
ADD COLUMN IF NOT EXISTS target_rank INTEGER,
ADD COLUMN IF NOT EXISTS goal_college TEXT,
ADD COLUMN IF NOT EXISTS goal_branch TEXT;

-- Add premium validity field (replaces premium_since)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS premium_until TIMESTAMP WITH TIME ZONE;

-- Create index for premium_until for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_premium_until ON users(premium_until);

-- Add comment to explain premium_until
COMMENT ON COLUMN users.premium_until IS 'Premium subscription validity until this date. NULL means not premium. Check this field to determine if user has active premium.';

-- Update orders table to include plan duration
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS plan_duration INTEGER CHECK (plan_duration IN (1, 3, 6, 12));

-- Add comment to explain plan_duration
COMMENT ON COLUMN orders.plan_duration IS 'Subscription duration in months: 1, 3, 6, or 12';

