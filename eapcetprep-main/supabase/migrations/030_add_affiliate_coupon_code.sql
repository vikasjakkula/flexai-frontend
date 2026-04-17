-- Add optional coupon_code to affiliates. Each affiliate can have one coupon (e.g. SAVE100) for ₹100 off.
ALTER TABLE affiliates
ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(32) NULL UNIQUE;

COMMENT ON COLUMN affiliates.coupon_code IS 'Optional coupon code for this affiliate; gives ₹100 off on paywall when applied.';
