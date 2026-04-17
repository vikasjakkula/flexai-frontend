-- Fix order status constraint to allow subscription-related statuses
-- Drop old constraint if it exists
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new constraint that allows: pending, completed, failed, cancelled, trial_active, halted
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'trial_active', 'halted'));





