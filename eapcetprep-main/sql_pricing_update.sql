-- SQL Migration: Update pricing structure (if needed)
-- Note: Pricing is primarily stored in application code, not database
-- This SQL is only needed if you want to update existing order references or add pricing metadata

-- No database changes needed for pricing structure as:
-- 1. Pricing is calculated at order creation time in application code
-- 2. Orders table stores the actual amount paid (which is correct)
-- 3. Plan duration is already stored in orders.plan_duration

-- However, if you want to add pricing metadata for reference or analytics:

-- Optional: Create a pricing_plans reference table (for future use)
CREATE TABLE IF NOT EXISTS pricing_plans (
    id SERIAL PRIMARY KEY,
    duration_months INTEGER UNIQUE NOT NULL,
    total_price_inr INTEGER NOT NULL,
    price_per_month_inr DECIMAL(10, 2) NOT NULL,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_best_value BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert/Update pricing plans
INSERT INTO pricing_plans (duration_months, total_price_inr, price_per_month_inr, discount_percentage, is_best_value)
VALUES
    (1, 299, 299.00, 0.00, false),
    (3, 499, 166.33, 44.40, false),
    (6, 599, 99.83, 66.60, false),
    (12, 699, 58.25, 80.50, true)
ON CONFLICT (duration_months) 
DO UPDATE SET
    total_price_inr = EXCLUDED.total_price_inr,
    price_per_month_inr = EXCLUDED.price_per_month_inr,
    discount_percentage = EXCLUDED.discount_percentage,
    is_best_value = EXCLUDED.is_best_value,
    updated_at = NOW();

-- Verify the data
SELECT 
    duration_months || ' month' || CASE WHEN duration_months > 1 THEN 's' ELSE '' END as plan,
    total_price_inr as "Total (₹)",
    price_per_month_inr as "Per Month (₹)",
    discount_percentage as "Discount (%)",
    CASE WHEN is_best_value THEN '⭐ BEST VALUE' ELSE '' END as note
FROM pricing_plans
ORDER BY duration_months;


















