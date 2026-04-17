-- Fix existing RLS policies that use Supabase Auth
-- Since we're using custom JWT auth, disable RLS and rely on application-level auth

-- Fix orders table RLS
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Drop existing policies that use auth.uid()
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Affiliates can view orders they referred" ON orders;
DROP POLICY IF EXISTS "Service role can manage orders" ON orders;

