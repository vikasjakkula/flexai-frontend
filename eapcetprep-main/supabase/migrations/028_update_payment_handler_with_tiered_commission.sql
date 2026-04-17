-- Update handle_successful_payment function to calculate commission based on sales count
-- First 10 sales use commission_rate_first, sales after 10 use commission_rate_second

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
  v_plan_tier TEXT;
  v_plan_duration INTEGER;
  v_premium_until TIMESTAMP WITH TIME ZONE;
  v_commission_rate_first INTEGER;
  v_commission_rate_second INTEGER;
  v_sales_count INTEGER;
  v_selected_commission_rate INTEGER;
BEGIN
  -- Get order details including user_id, amount, plan_tier, plan_duration, and affiliate_id
  SELECT user_id, amount, plan_tier, plan_duration, affiliate_id 
  INTO v_user_id, v_order_amount, v_plan_tier, v_plan_duration, v_order_affiliate_id
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Validate that user_id is not null (required for affiliate_sales)
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Order user_id is null - user must be authenticated';
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

  -- PRIORITIZE order's affiliate_id (most reliable source)
  -- If order has affiliate_id, use it directly
  IF v_order_affiliate_id IS NOT NULL THEN
    v_actual_affiliate_id := v_order_affiliate_id;
    
    -- Also update the most recent affiliate visit for this user to link it (for tracking)
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
    SELECT av.affiliate_id INTO v_actual_affiliate_id
    FROM affiliate_visits av
    WHERE av.user_id = v_user_id
    ORDER BY COALESCE(av.created_at, av.first_visited_at) DESC
    LIMIT 1;
  END IF;

  -- If we found an affiliate (from order or visits), create commission
  IF v_actual_affiliate_id IS NOT NULL THEN
    -- Get commission rates from affiliates table
    SELECT commission_rate_first, commission_rate_second
    INTO v_commission_rate_first, v_commission_rate_second
    FROM affiliates
    WHERE id = v_actual_affiliate_id;

    -- Use defaults if not set (shouldn't happen due to migration, but safety check)
    v_commission_rate_first := COALESCE(v_commission_rate_first, 30);
    v_commission_rate_second := COALESCE(v_commission_rate_second, 40);

    -- Count existing sales for this affiliate (before adding the new one)
    SELECT COUNT(*) INTO v_sales_count
    FROM affiliate_sales
    WHERE affiliate_id = v_actual_affiliate_id;

    -- Determine which commission rate to use
    -- First 10 sales (0-9) use first rate, sales 11+ use second rate
    IF v_sales_count < 10 THEN
      v_selected_commission_rate := v_commission_rate_first;
    ELSE
      v_selected_commission_rate := v_commission_rate_second;
    END IF;

    -- Calculate commission based on selected rate
    v_commission_amount := v_order_amount * v_selected_commission_rate / 100;

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
      user_id,
      order_id,
      amount,
      commission_amount,
      status
    ) VALUES (
      v_actual_affiliate_id,
      v_user_id,
      p_order_id::TEXT,
      v_order_amount,
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

