# Affiliate System Fixes Summary

## Issues Fixed

1. **Missing columns in `affiliate_visits` table** - `referrer` and `user_agent` columns were missing
2. **Payment handler priority** - Now prioritizes order's `affiliate_id` over visit lookup
3. **Dashboard logging** - Added logging to debug sales display issues

## SQL Migrations to Run

### 1. Add Missing Columns to affiliate_visits

```sql
-- File: supabase/migrations/018_add_referrer_user_agent_to_visits.sql

-- Add missing referrer and user_agent columns to affiliate_visits table
ALTER TABLE affiliate_visits 
ADD COLUMN IF NOT EXISTS referrer TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Add index on user_id if it doesn't exist (for faster lookups during payment processing)
CREATE INDEX IF NOT EXISTS idx_affiliate_visits_user_id ON affiliate_visits(user_id);

-- Add index on created_at if it doesn't exist (for faster sorting)
CREATE INDEX IF NOT EXISTS idx_affiliate_visits_created_at ON affiliate_visits(created_at);

-- Add comment to explain the columns
COMMENT ON COLUMN affiliate_visits.referrer IS 'HTTP referer header from the visit';
COMMENT ON COLUMN affiliate_visits.user_agent IS 'User agent string from the visit';
```

### 2. Update Payment Handler Function

```sql
-- File: supabase/migrations/014_fix_payment_handler_affiliate_fallback.sql
-- (Already updated in the file, just needs to be run)

DROP FUNCTION IF EXISTS handle_successful_payment(UUID, TEXT);

CREATE OR REPLACE FUNCTION handle_successful_payment(
  p_order_id UUID,
  p_payment_id TEXT
) RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_affiliate_code TEXT;
  v_actual_affiliate_id UUID;
  v_order_affiliate_id UUID;
  v_order_amount INTEGER;
  v_commission_amount INTEGER;
  v_plan_duration INTEGER;
  v_premium_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get order details including user_id, amount, plan_duration, and affiliate_id
  SELECT user_id, amount, plan_duration, affiliate_id 
  INTO v_user_id, v_order_amount, v_plan_duration, v_order_affiliate_id
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Calculate premium_until date based on plan_duration
  IF v_plan_duration IS NULL THEN
    -- Default to 1 year if plan_duration is not set (for backward compatibility)
    v_premium_until := NOW() + INTERVAL '1 year';
  ELSE
    v_premium_until := NOW() + (v_plan_duration || ' months')::INTERVAL;
  END IF;

  -- PRIORITIZE order's affiliate_id (most reliable source)
  -- If order has affiliate_id, use it directly
  IF v_order_affiliate_id IS NOT NULL THEN
    v_actual_affiliate_id := v_order_affiliate_id;
    
    -- Also update the most recent affiliate visit for this user to link it (for tracking)
    UPDATE affiliate_visits
    SET user_id = v_user_id
    WHERE affiliate_id = v_order_affiliate_id
      AND user_id IS NULL
    ORDER BY COALESCE(created_at, first_visited_at) DESC
    LIMIT 1;
  ELSE
    -- Fallback: Try to get affiliate from the most recent visit for this user
    -- Use COALESCE to handle both created_at and first_visited_at
    SELECT av.affiliate_id INTO v_actual_affiliate_id
    FROM affiliate_visits av
    WHERE av.user_id = v_user_id
    ORDER BY COALESCE(av.created_at, av.first_visited_at) DESC
    LIMIT 1;
  END IF;

  -- If we found an affiliate (from order or visits), create commission
  IF v_actual_affiliate_id IS NOT NULL THEN
    -- Calculate commission (20% of order amount)
    v_commission_amount := v_order_amount * 20 / 100;

    -- Update order status and set affiliate_id (ensure it's set)
    UPDATE orders
    SET 
      status = 'completed',
      razorpay_payment_id = p_payment_id,
      affiliate_id = v_actual_affiliate_id,
      updated_at = NOW()
    WHERE id = p_order_id;

    -- Create affiliate commission record (only if it doesn't exist)
    INSERT INTO affiliate_sales (
      affiliate_id,
      user_id,
      order_id,
      amount,
      commission_amount,
      status
    ) 
    SELECT 
      v_actual_affiliate_id,
      v_user_id,
      p_order_id::TEXT,
      v_order_amount,
      v_commission_amount,
      'pending'
    WHERE NOT EXISTS (
      SELECT 1 FROM affiliate_sales WHERE order_id = p_order_id::TEXT
    );
  ELSE
    -- No affiliate, just update order status
    UPDATE orders
    SET 
      status = 'completed',
      razorpay_payment_id = p_payment_id,
      updated_at = NOW()
    WHERE id = p_order_id;
  END IF;

  -- Update user's premium status with premium_until date
  UPDATE users
  SET 
    is_premium = true,
    premium_until = v_premium_until,
    updated_at = NOW()
  WHERE id = v_user_id;
END;
$$ LANGUAGE plpgsql;
```

## How It Works Now

### Visit Tracking Flow:
1. User visits `/?ref=wSWN7DNX`
2. Middleware detects `ref` parameter
3. Looks up affiliate by code in `affiliates` table
4. Records visit in `affiliate_visits` with:
   - `affiliate_id`
   - `visitor_ip`
   - `referrer` (HTTP referer header)
   - `user_agent` (browser user agent)
   - `utm_source`, `utm_medium`, `utm_campaign` (if present)
5. Sets cookies: `affiliate_code` and `affiliate_id` (30-day expiry)

### Payment Flow:
1. User creates order → `affiliate_id` stored in `orders` table from cookie
2. User completes payment → Payment verification calls `handle_successful_payment`
3. Function prioritizes order's `affiliate_id` (most reliable)
4. Creates record in `affiliate_sales` with:
   - `affiliate_id` (from order)
   - `user_id` (customer)
   - `order_id`
   - `amount` (order amount)
   - `commission_amount` (20% of order amount)
   - `status` ('pending')

### Dashboard Flow:
1. Affiliate logs in → Authenticated via `affiliate_user_id`
2. Dashboard queries `affiliates` table by `affiliate_user_id`
3. Gets `affiliate.id` from the affiliate record
4. Queries `affiliate_visits` by `affiliate_id` for visit count
5. Queries `affiliate_sales` by `affiliate_id` for sales/commissions

## Testing Checklist

- [ ] Run migration `018_add_referrer_user_agent_to_visits.sql`
- [ ] Run migration `014_fix_payment_handler_affiliate_fallback.sql` (if not already run)
- [ ] Visit `/?ref=wSWN7DNX` - should record visit without errors
- [ ] Check cookies - should have `affiliate_code` and `affiliate_id`
- [ ] Make a payment - check logs for `affiliateId` in order creation
- [ ] Check `affiliate_sales` table - should have new record
- [ ] Check affiliate dashboard - should show sales

## Debugging

If sales still don't show in dashboard:
1. Check console logs in `/api/affiliate/details` route
2. Verify `affiliate_sales` table has records with correct `affiliate_id`
3. Verify dashboard is querying by correct `affiliate.id` (not `affiliate_user_id`)
4. Check that `affiliate.status` is 'active'
















