-- Update affiliates table to reference affiliate_users instead of users
-- This migration handles the transition from users to affiliate_users

-- Step 1: Add new column for affiliate_user_id (nullable initially)
ALTER TABLE affiliates 
ADD COLUMN IF NOT EXISTS affiliate_user_id UUID REFERENCES affiliate_users(id);

-- Step 2: For existing affiliates, we'll need to migrate data
-- Note: This assumes existing affiliates have corresponding users
-- If you have existing data, you may need to create affiliate_users records first

-- Step 3: Make user_id nullable (we'll remove it later after migration)
ALTER TABLE affiliates 
ALTER COLUMN user_id DROP NOT NULL;

-- Step 4: Add constraint to ensure either user_id or affiliate_user_id is set
-- (We'll add this after migration is complete)
-- For now, we'll allow both to be nullable during transition

-- Step 5: Update affiliate_visits to also support affiliate_user_id
ALTER TABLE affiliate_visits
ADD COLUMN IF NOT EXISTS affiliate_user_id UUID REFERENCES affiliate_users(id);

-- Step 6: Update affiliate_sales - keep user_id as it refers to the customer (regular user)
-- affiliate_sales.user_id should remain as it refers to the customer who made the purchase

-- Add comments
COMMENT ON COLUMN affiliates.affiliate_user_id IS 'Reference to affiliate_users table - the affiliate account';
COMMENT ON COLUMN affiliates.user_id IS 'Legacy field - will be removed after migration. Use affiliate_user_id instead.';
COMMENT ON COLUMN affiliate_visits.affiliate_user_id IS 'The affiliate user who referred this visit (if affiliate logged in)';
















