-- ============================================
-- FIX AFFILIATE SYSTEM ISSUES
-- Run this SQL script to fix all affiliate tracking issues
-- ============================================

-- Step 1: Add missing columns to affiliate_visits table
ALTER TABLE affiliate_visits 
ADD COLUMN IF NOT EXISTS referrer TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Step 2: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_affiliate_visits_user_id ON affiliate_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_visits_created_at ON affiliate_visits(created_at);

-- Step 3: Add comments to explain the columns
COMMENT ON COLUMN affiliate_visits.referrer IS 'HTTP referer header from the visit';
COMMENT ON COLUMN affiliate_visits.user_agent IS 'User agent string from the visit';

-- Step 4: Update payment handler function to prioritize order's affiliate_id
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
    -- Use a subquery to get the most recent visit first, then update it
    UPDATE affiliate_visits
    SET user_id = v_user_id
    WHERE id = (
      SELECT id
      FROM affiliate_visits
      WHERE affiliate_id = v_order_affiliate_id
        AND user_id IS NULL
      ORDER BY COALESCE(created_at, first_visited_at) DESC
      LIMIT 1
    );
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

-- ============================================
-- VERIFICATION QUERIES (Optional - run to verify)
-- ============================================

-- Check if columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'affiliate_visits' 
  AND column_name IN ('referrer', 'user_agent', 'created_at');

-- Check if function was created
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'handle_successful_payment';

-- Check recent affiliate visits
SELECT id, affiliate_id, visitor_ip, referrer, user_agent, created_at
FROM affiliate_visits
ORDER BY created_at DESC
LIMIT 5;

