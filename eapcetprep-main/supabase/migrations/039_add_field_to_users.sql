-- Add field column to users table for medical/engineering selection
ALTER TABLE users ADD COLUMN IF NOT EXISTS field TEXT NOT NULL DEFAULT 'engineering';

-- Add check constraint to only allow valid values
ALTER TABLE users ADD CONSTRAINT users_field_check CHECK (field IN ('engineering', 'medical'));
