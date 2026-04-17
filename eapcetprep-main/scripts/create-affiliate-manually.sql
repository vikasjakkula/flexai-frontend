-- =====================================================
-- Manual Affiliate Account Creation (SQL Script)
-- =====================================================
-- This script creates an affiliate account directly in the database
-- without requiring OTP verification.
--
-- IMPORTANT: Before running this script, you MUST:
-- 1. Hash the password using bcrypt (salt rounds: 10)
-- 2. Generate a unique affiliate code (8-10 alphanumeric characters)
-- 3. Replace all placeholders below with actual values
-- =====================================================

-- Step 1: Create the affiliate user account
-- Replace these values:
--   - '9876543210' with the 10-digit phone number
--   - '$2a$10$YOUR_HASHED_PASSWORD_HERE' with the bcrypt hash of the password
--   - 'John Doe' with the name (or NULL)
--   - 'john@example.com' with the email (or NULL)

INSERT INTO affiliate_users (phone, password, name, email)
VALUES (
  '9876543210',  -- ⚠️ REPLACE: 10-digit phone number
  '$2a$10$YOUR_HASHED_PASSWORD_HERE',  -- ⚠️ REPLACE: bcrypt hash of password
  'John Doe',  -- ⚠️ REPLACE: Name (or NULL)
  'john@example.com'  -- ⚠️ REPLACE: Email (or NULL)
)
RETURNING id, phone, name, email, created_at;

-- After running Step 1, note the returned 'id' value
-- You'll need it for Step 2

-- =====================================================
-- Step 2: Create the affiliate record (Optional)
-- =====================================================
-- This step allows the affiliate to earn commissions
-- Replace:
--   - 'UUID_FROM_STEP_1' with the id from Step 1
--   - 'AFF12345' with a unique affiliate code (8-10 characters)
--   - Payment details based on payment method

-- OPTION A: For UPI payment method
INSERT INTO affiliates (
  affiliate_user_id,
  affiliate_code,
  payment_method,
  payment_details,
  status,
  terms_accepted_at
)
VALUES (
  'UUID_FROM_STEP_1',  -- ⚠️ REPLACE: Use the id from Step 1
  'AFF12345',  -- ⚠️ REPLACE: Unique 8-10 character code
  'upi',
  '{"upi_id": "john@upi"}'::jsonb,  -- ⚠️ REPLACE: Your UPI ID
  'active',  -- Options: 'pending', 'active', 'suspended'
  NOW()
)
RETURNING id, affiliate_code, status, payment_method;

-- OPTION B: For Bank payment method
-- Uncomment and use this instead of OPTION A if using bank transfer
/*
INSERT INTO affiliates (
  affiliate_user_id,
  affiliate_code,
  payment_method,
  payment_details,
  status,
  terms_accepted_at
)
VALUES (
  'UUID_FROM_STEP_1',  -- ⚠️ REPLACE: Use the id from Step 1
  'AFF12345',  -- ⚠️ REPLACE: Unique 8-10 character code
  'bank',
  '{"account_number": "1234567890", "ifsc_code": "ABCD0123456"}'::jsonb,  -- ⚠️ REPLACE: Bank details
  'active',  -- Options: 'pending', 'active', 'suspended'
  NOW()
)
RETURNING id, affiliate_code, status, payment_method;
*/

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check if affiliate user was created successfully
SELECT id, phone, name, email, created_at 
FROM affiliate_users 
WHERE phone = '9876543210';  -- ⚠️ REPLACE: Use the phone number you inserted

-- Check if affiliate record exists (if you created one)
SELECT 
  a.id as affiliate_id,
  a.affiliate_code,
  a.status,
  a.payment_method,
  a.payment_details,
  au.id as user_id,
  au.phone,
  au.name,
  au.email
FROM affiliates a
JOIN affiliate_users au ON a.affiliate_user_id = au.id
WHERE au.phone = '9876543210';  -- ⚠️ REPLACE: Use the phone number you inserted

-- =====================================================
-- Password Hashing Instructions
-- =====================================================
-- 
-- To hash a password for use in this script, you have several options:
--
-- OPTION 1: Using Node.js (Recommended)
-- Run this in Node.js:
--   const bcrypt = require('bcryptjs');
--   const hash = await bcrypt.hash('your-password', 10);
--   console.log(hash);
--
-- OPTION 2: Using the create-affiliate-manually.js script
-- The Node.js script handles password hashing automatically:
--   node scripts/create-affiliate-manually.js
--
-- OPTION 3: Using online bcrypt generator (Less secure)
-- Visit a bcrypt generator website (use with caution for production)
-- Set salt rounds to 10
-- Input your password and copy the hash
--
-- =====================================================
-- Affiliate Code Generation
-- =====================================================
--
-- Generate a unique 8-10 character alphanumeric code.
-- Examples: 'AFF12345', 'REF98765', 'PARTNER1'
-- Make sure it's unique by checking:
--   SELECT * FROM affiliates WHERE affiliate_code = 'YOUR_CODE';
-- If a row is returned, the code already exists. Try a different one.
--
-- =====================================================
-- Notes
-- =====================================================
--
-- 1. Phone numbers must be unique (10 digits only)
-- 2. Affiliate codes must be unique
-- 3. Password must be a valid bcrypt hash ($2a$10$... format)
-- 4. After creating the account, the affiliate can login at /affiliate/auth/login
-- 5. They will use the original plain password (not the hash) to login
-- 6. If you only create the affiliate_user (Step 1), they can complete
--    affiliate registration through the UI after logging in
--
-- =====================================================











