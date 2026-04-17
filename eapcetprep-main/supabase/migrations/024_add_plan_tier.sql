-- Add plan_tier to users
DO $$ BEGIN
  CREATE TYPE plan_tier AS ENUM ('FREE', 'BASIC', 'PRO');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS plan_tier plan_tier DEFAULT 'FREE',
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT;

CREATE INDEX IF NOT EXISTS idx_users_plan_tier ON users(plan_tier);

-- Update orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'one_time',
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS plan_tier TEXT;

-- Update plan_duration constraint to allow 4 (BASIC) and -1 (PRO lifetime)
-- Drop old constraint if it exists
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_plan_duration_check;
-- Add new constraint that allows: 1, 3, 4, 6, 12, -1 (and NULL for backward compatibility)
ALTER TABLE orders ADD CONSTRAINT orders_plan_duration_check 
  CHECK (plan_duration IS NULL OR plan_duration IN (1, 3, 4, 6, 12, -1));

-- Update order status constraint to allow subscription-related statuses
-- Drop old constraint if it exists
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
-- Add new constraint that allows: pending, completed, failed, cancelled, trial_active, halted
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'trial_active', 'halted'));

-- Migrate existing premium users to PRO (honor their purchase)
UPDATE users SET plan_tier = 'PRO' WHERE is_premium = true AND premium_until > NOW();
UPDATE users SET plan_tier = 'FREE' WHERE plan_tier IS NULL;

-- Update handle_successful_payment function to handle plan_tier
CREATE OR REPLACE FUNCTION handle_successful_payment(
  p_order_id UUID,
  p_payment_id TEXT
) RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_affiliate_code TEXT;
  v_actual_affiliate_id UUID;
  v_order_amount INTEGER;
  v_commission_amount INTEGER;
  v_plan_tier TEXT;
  v_plan_duration INTEGER;
  v_premium_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get order details including user_id, amount, plan_tier, and plan_duration
  SELECT user_id, amount, plan_tier, plan_duration INTO v_user_id, v_order_amount, v_plan_tier, v_plan_duration
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Calculate premium_until based on plan_tier
  IF v_plan_tier = 'PRO' THEN
    -- Lifetime access
    v_premium_until := '2099-12-31'::timestamp with time zone;
  ELSIF v_plan_tier = 'BASIC' THEN
    -- 4 months access
    v_premium_until := NOW() + INTERVAL '4 months';
  ELSE
    -- Fallback to plan_duration for backwards compatibility
    -- Handle NULL plan_duration (default to 1 year like old function)
    IF v_plan_duration IS NULL THEN
      v_premium_until := NOW() + INTERVAL '1 year';
    ELSE
      v_premium_until := NOW() + (v_plan_duration || ' months')::interval;
    END IF;
  END IF;

  -- Get affiliate information from the most recent visit for this user
  SELECT av.affiliate_id INTO v_actual_affiliate_id
  FROM affiliate_visits av
  WHERE av.user_id = v_user_id
  ORDER BY av.created_at DESC
  LIMIT 1;

  -- If we found an affiliate visit, use that affiliate_id
  IF v_actual_affiliate_id IS NOT NULL THEN
    -- Calculate commission (20% of order amount)
    v_commission_amount := v_order_amount * 20 / 100;

    -- Update order status and set affiliate_id
    UPDATE orders
    SET
      status = 'completed',
      razorpay_payment_id = p_payment_id,
      affiliate_id = v_actual_affiliate_id,
      updated_at = NOW()
    WHERE id = p_order_id;

    -- Create affiliate commission record
    INSERT INTO affiliate_sales (
      affiliate_id,
      order_id,
      commission_amount,
      status
    ) VALUES (
      v_actual_affiliate_id,
      p_order_id,
      v_commission_amount,
      'pending'
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

  -- Update user's premium status and plan_tier
  UPDATE users
  SET
    is_premium = true,
    premium_since = COALESCE(premium_since, NOW()),
    premium_until = v_premium_until,
    plan_tier = COALESCE(v_plan_tier::plan_tier, 'PRO')
  WHERE id = v_user_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE; -- Re-raise the error to be handled by the caller
END;
$$ LANGUAGE plpgsql;
