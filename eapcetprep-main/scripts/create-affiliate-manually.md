# How to Create Affiliate Account Manually (Without OTP)

This guide explains how to create an affiliate account directly in the database, bypassing the OTP verification process.

## Quick Start

**Recommended Method**: Use the Node.js script (handles password hashing automatically)
```bash
node scripts/create-affiliate-manually.js
```

**Alternative Method**: Use SQL directly (requires manual password hashing)
- See `scripts/create-affiliate-manually.sql` for a ready-to-use SQL script
- Or follow the SQL instructions below

## Database Structure

The affiliate system uses two main tables:

1. **`affiliate_users`** - Stores authentication credentials (phone, password, name, email)
2. **`affiliates`** - Stores affiliate business details (affiliate_code, payment_method, payment_details, status)

## Method 1: Using Node.js Script (Recommended) ⭐

This script will hash the password properly using bcrypt and create both the affiliate user and affiliate record automatically.

### Prerequisites:
- Node.js installed
- Dependencies installed: `npm install`
- Environment variables set in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Steps:

1. Run the script:
```bash
node scripts/create-affiliate-manually.js
```

2. The script will prompt you for:
   - Phone number (10 digits) - **Required**
   - Password (min 6 characters) - **Required** (will be hashed automatically)
   - Name (optional, press Enter to skip)
   - Email (optional, press Enter to skip)
   - Whether to create affiliate record (y/n)
   - If yes:
     - Payment method (upi/bank)
     - Payment details (UPI ID or Bank account + IFSC)
     - Status (pending/active/suspended, default: active)

3. The script will:
   - ✅ Check if phone number already exists
   - ✅ Hash the password using bcrypt
   - ✅ Create the affiliate user account
   - ✅ Optionally create the affiliate record with a unique affiliate code
   - ✅ Display all created information

### Example Output:
```
✅ Affiliate user created successfully!
   ID: 123e4567-e89b-12d3-a456-426614174000
   Phone: 9876543210
   Name: John Doe
   Email: john@example.com

✅ Affiliate record created successfully!
   Affiliate ID: abc123...
   Affiliate Code: A1B2C3D4
   Status: active
   Payment Method: upi
```

**Note**: After running the script, the affiliate can login immediately at `/affiliate/auth/login` using the phone number and password you provided.

## Method 2: Using SQL Script

For those who prefer SQL or need to create accounts via database tools (like Supabase SQL Editor).

### Option A: Use the Provided SQL Script

1. Open `scripts/create-affiliate-manually.sql` in your SQL editor
2. Follow the instructions in the comments to replace placeholders
3. Hash your password first (see Password Hashing section below)
4. Execute the SQL statements

### Option B: Direct SQL Insert (Manual)

### Step 1: Hash the Password

**⚠️ CRITICAL**: You must hash the password using bcrypt before inserting. Plain text passwords will NOT work.

**Option 1: Using Node.js (Recommended)**
```javascript
const bcrypt = require('bcryptjs');
const password = 'your-plain-password';
const hash = await bcrypt.hash(password, 10);
console.log(hash);  // Copy this hash to use in SQL
```

**Option 2: Using the Node.js script (Easiest)**
Just run `node scripts/create-affiliate-manually.js` - it handles hashing automatically.

**Option 3: Online bcrypt generator**
Visit a bcrypt generator website and set salt rounds to 10 (⚠️ use with caution for production)

### Step 2: Insert into `affiliate_users` table

```sql
INSERT INTO affiliate_users (phone, password, name, email)
VALUES (
  '9876543210',  -- Replace with 10-digit phone number
  '$2a$10$YOUR_HASHED_PASSWORD_HERE',  -- Replace with bcrypt hash
  'John Doe',  -- Optional: Name
  'john@example.com'  -- Optional: Email
)
RETURNING id, phone, name, email, created_at;
```

**Important**: 
- Phone must be exactly 10 digits
- Phone must be unique (no duplicate accounts)
- Password must be a valid bcrypt hash

### Step 3: Insert into `affiliates` table (Optional)

This step is optional. If you want the affiliate to be able to start earning commissions immediately:

```sql
INSERT INTO affiliates (
  affiliate_user_id,
  affiliate_code,
  payment_method,
  payment_details,
  status,
  terms_accepted_at
)
VALUES (
  'UUID_FROM_STEP_2',  -- The id returned from affiliate_users insert
  'ABC12345',  -- Generate a unique 8-character code (or use nanoid)
  'upi',  -- or 'bank'
  '{"upi_id": "john@upi"}'::jsonb,  -- For UPI: {"upi_id": "your@upi"}
  -- For bank: {"account_number": "1234567890", "ifsc_code": "ABCD0123456"}
  'active',  -- or 'pending' if you want to review first
  NOW()
)
RETURNING id, affiliate_code, status;
```

**Note**: 
- `affiliate_code` must be unique (8-10 characters recommended)
- For UPI: `payment_details` should be `{"upi_id": "your@upi"}`
- For bank: `payment_details` should be `{"account_number": "1234567890", "ifsc_code": "ABCD0123456"}`
- Status can be: `'pending'`, `'active'`, or `'suspended'`

## Example: Complete Manual Creation

```sql
-- Step 1: Create affiliate user
-- First, hash password "mypassword123" -> $2a$10$example_hash_here

INSERT INTO affiliate_users (phone, password, name, email)
VALUES (
  '9876543210',
  '$2a$10$rQx4Z2Zx8KxZx8KxZx8K.uV5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5',
  'Test Affiliate',
  'test@example.com'
)
RETURNING id;

-- Step 2: Note the returned id (e.g., '123e4567-e89b-12d3-a456-426614174000')
-- Then create affiliate record

INSERT INTO affiliates (
  affiliate_user_id,
  affiliate_code,
  payment_method,
  payment_details,
  status,
  terms_accepted_at
)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',  -- Use id from Step 1
  'TEST1234',  -- Unique code
  'upi',
  '{"upi_id": "test@upi"}'::jsonb,
  'active',
  NOW()
)
RETURNING id, affiliate_code;
```

## Verification

After creating the account, verify it was created correctly:

```sql
-- Check affiliate user
SELECT id, phone, name, email, created_at 
FROM affiliate_users 
WHERE phone = '9876543210';

-- Check affiliate record (if created)
SELECT a.id, a.affiliate_code, a.status, a.payment_method, au.phone, au.name
FROM affiliates a
JOIN affiliate_users au ON a.affiliate_user_id = au.id
WHERE au.phone = '9876543210';
```

## Login

After creating the account manually, the affiliate can login normally at `/affiliate/auth/login` using:
- Phone: The phone number you inserted
- Password: The original plain password (not the hash)

## Important Notes

1. **Password Hashing**: Never insert plain text passwords. Always use bcrypt with salt rounds of 10.
2. **Unique Constraints**: 
   - Phone numbers must be unique in `affiliate_users`
   - Affiliate codes must be unique in `affiliates`
3. **Affiliate Code Generation**: Use a tool like `nanoid(8)` or generate a random 8-character alphanumeric code.
4. **Security**: This method bypasses OTP verification. Only use for trusted accounts or testing.

## Troubleshooting

### Error: "duplicate key value violates unique constraint"
- Phone number or affiliate code already exists
- Check existing records before inserting

### Error: "password authentication failed" when logging in
- Password hash is incorrect
- Make sure you used bcrypt with 10 salt rounds
- Verify the hash format matches: `$2a$10$...`

### Error: "foreign key constraint violation"
- The `affiliate_user_id` in `affiliates` table doesn't exist in `affiliate_users`
- Make sure to insert into `affiliate_users` first and use the returned `id`

