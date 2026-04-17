-- Add amount_rupees to payment_share_links so shared links carry the exact price (coupon/spin applied).
ALTER TABLE payment_share_links
ADD COLUMN IF NOT EXISTS amount_rupees numeric;

COMMENT ON COLUMN payment_share_links.amount_rupees IS 'Price in INR when link was created; used for display and charge. Null = use plan default.';
