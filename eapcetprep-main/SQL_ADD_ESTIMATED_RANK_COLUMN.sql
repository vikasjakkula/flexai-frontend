-- SQL code to add estimated_rank column to test_results table
-- Run this in your Supabase SQL editor or database client

-- Add estimated_rank column to test_results table
-- Stores both estimatedRank (number) and rankRange (string) as JSONB
ALTER TABLE test_results 
ADD COLUMN IF NOT EXISTS estimated_rank JSONB;

-- Add comment to explain the column structure
COMMENT ON COLUMN test_results.estimated_rank IS 'Stores estimated rank data: {"estimatedRank": number, "rankRange": string}';






