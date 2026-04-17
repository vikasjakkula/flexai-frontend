-- Make name, email, and college nullable so users can be created with just phone/password
-- These fields will be filled in during onboarding

ALTER TABLE users 
ALTER COLUMN name DROP NOT NULL,
ALTER COLUMN email DROP NOT NULL,
ALTER COLUMN college DROP NOT NULL;

-- Add comments to explain these can be null initially
COMMENT ON COLUMN users.name IS 'User name - filled during onboarding';
COMMENT ON COLUMN users.email IS 'User email - filled during onboarding';
COMMENT ON COLUMN users.college IS 'User college - filled during onboarding';


















