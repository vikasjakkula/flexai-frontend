-- First, add necessary columns to affiliate_visits if they don't exist
ALTER TABLE affiliate_visits 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Drop existing functions with the same name to avoid conflicts
DROP FUNCTION IF EXISTS handle_successful_payment(UUID, TEXT, UUID, INTEGER);
DROP FUNCTION IF EXISTS handle_successful_payment(UUID, TEXT, UUID, NUMERIC);

-- Create a function to handle successful payments and affiliate commissions
CREATE OR REPLACE FUNCTION handle_successful_payment(
  p_order_id UUID,
  p_payment_id TEXT,
  p_affiliate_id UUID,
  p_commission_amount INTEGER
) RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_affiliate_code TEXT;
  v_actual_affiliate_id UUID;
  v_order_amount INTEGER;
  v_commission_amount INTEGER;
BEGIN
  -- Get order details including user_id and amount
  SELECT user_id, amount INTO v_user_id, v_order_amount
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
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

  -- Update user's premium status
  UPDATE users
  SET 
    is_premium = true,
    premium_since = NOW()
  WHERE id = v_user_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE; -- Re-raise the error to be handled by the caller
END;
$$ LANGUAGE plpgsql; 