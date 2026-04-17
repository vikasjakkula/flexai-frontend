-- Fix users table: Add onboarding and premium fields, make name/email/college nullable

-- Step 1: Make name, email, and college nullable (so users can be created with just phone/password)
ALTER TABLE users 
ALTER COLUMN name DROP NOT NULL,
ALTER COLUMN email DROP NOT NULL,
ALTER COLUMN college DROP NOT NULL;

-- Step 2: Add onboarding fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS year_of_study VARCHAR(50),
ADD COLUMN IF NOT EXISTS target_year VARCHAR(10),
ADD COLUMN IF NOT EXISTS target_rank INTEGER,
ADD COLUMN IF NOT EXISTS goal_college TEXT,
ADD COLUMN IF NOT EXISTS goal_branch TEXT;

-- Step 3: Add premium validity field (replaces premium_since)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS premium_until TIMESTAMP WITH TIME ZONE;

-- Step 4: Create index for premium_until for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_premium_until ON users(premium_until);

-- Step 5: Add comments to explain fields
COMMENT ON COLUMN users.name IS 'User name - filled during onboarding';
COMMENT ON COLUMN users.email IS 'User email - filled during onboarding';
COMMENT ON COLUMN users.college IS 'User college - filled during onboarding';
COMMENT ON COLUMN users.premium_until IS 'Premium subscription validity until this date. NULL means not premium. Check this field to determine if user has active premium.';

-- Step 6: Update orders table to include plan duration (if not exists)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS plan_duration INTEGER CHECK (plan_duration IN (1, 3, 6, 12));

COMMENT ON COLUMN orders.plan_duration IS 'Subscription duration in months: 1, 3, 6, or 12';

