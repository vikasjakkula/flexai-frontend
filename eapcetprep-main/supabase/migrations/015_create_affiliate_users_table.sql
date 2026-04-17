-- Create affiliate_users table for separate affiliate authentication
-- This is separate from regular users table

CREATE TABLE IF NOT EXISTS affiliate_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    phone VARCHAR(10) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_affiliate_users_phone ON affiliate_users(phone);

-- Disable RLS since we're using service role for all operations
ALTER TABLE affiliate_users DISABLE ROW LEVEL SECURITY;
















