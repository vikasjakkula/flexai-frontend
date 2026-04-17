-- Remove affiliate_sales INSERT from handle_successful_payment.
-- Affiliate attribution is now done exclusively in the payment.captured webhook,
-- so it only happens when Razorpay confirms an actual capture — not on client-side verify.

CREATE OR REPLACE FUNCTION handle_successful_payment(
  p_order_id UUID,
  p_payment_id TEXT
) RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_order_affiliate_id UUID;
  v_order_amount INTEGER;
  v_plan_tier TEXT;
  v_plan_duration INTEGER;
  v_premium_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get order details
  SELECT user_id, amount, plan_tier, plan_duration, affiliate_id
  INTO v_user_id, v_order_amount, v_plan_tier, v_plan_duration, v_order_affiliate_id
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Order user_id is null - user must be authenticated';
  END IF;

  -- Calculate premium_until based on plan_tier
  IF v_plan_tier = 'PRO' THEN
    v_premium_until := '2099-12-31'::timestamp with time zone;
  ELSIF v_plan_tier = 'BASIC' THEN
    v_premium_until := NOW() + INTERVAL '4 months';
  ELSE
    IF v_plan_duration IS NULL THEN
      v_premium_until := NOW() + INTERVAL '1 year';
    ELSE
      v_premium_until := NOW() + (v_plan_duration || ' months')::interval;
    END IF;
  END IF;

  -- Update order status (affiliate_id already on the order from create-order)
  UPDATE orders
  SET
    status = 'completed',
    razorpay_payment_id = p_payment_id,
    updated_at = NOW()
  WHERE id = p_order_id;

  -- Upgrade user
  UPDATE users
  SET
    is_premium = true,
    premium_since = COALESCE(premium_since, NOW()),
    premium_until = v_premium_until,
    plan_tier = COALESCE(v_plan_tier::plan_tier, 'PRO')
  WHERE id = v_user_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql;
