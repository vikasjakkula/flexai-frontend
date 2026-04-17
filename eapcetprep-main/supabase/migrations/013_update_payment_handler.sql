-- Update handle_successful_payment function to set premium_until based on plan_duration

-- Drop all existing versions of the function
DROP FUNCTION IF EXISTS handle_successful_payment(UUID, TEXT);
DROP FUNCTION IF EXISTS handle_successful_payment(UUID, TEXT, UUID, INTEGER);
DROP FUNCTION IF EXISTS handle_successful_payment(UUID, TEXT, UUID, NUMERIC);

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
  v_plan_duration INTEGER;
  v_premium_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get order details including user_id, amount, and plan_duration
  SELECT user_id, amount, plan_duration INTO v_user_id, v_order_amount, v_plan_duration
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

  -- Update user's premium status with premium_until date
  UPDATE users
  SET 
    is_premium = true,
    premium_until = v_premium_until,
    updated_at = NOW()
  WHERE id = v_user_id;
END;
$$ LANGUAGE plpgsql;


