-- Add commission rate columns to affiliates table
-- commission_rate_first: commission percentage for first 10 sales (default 30)
-- commission_rate_second: commission percentage for sales after 10 (default 40)

ALTER TABLE affiliates 
ADD COLUMN IF NOT EXISTS commission_rate_first INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS commission_rate_second INTEGER DEFAULT 40;

-- Add comments to explain the columns
COMMENT ON COLUMN affiliates.commission_rate_first IS 'Commission percentage for the first 10 sales. Default is 30%.';
COMMENT ON COLUMN affiliates.commission_rate_second IS 'Commission percentage for sales after the first 10. Default is 40%.';

-- Update existing affiliates to have default values if they don't have them
UPDATE affiliates 
SET 
  commission_rate_first = COALESCE(commission_rate_first, 30),
  commission_rate_second = COALESCE(commission_rate_second, 40)
WHERE commission_rate_first IS NULL OR commission_rate_second IS NULL;

