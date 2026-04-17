-- Migration: Add sprite_css_url column to tests table
-- This column stores the URL to the sprite CSS file for each test
-- The CSS file contains sprite definitions for images in questions/options

ALTER TABLE tests ADD COLUMN IF NOT EXISTS sprite_css_url TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN tests.sprite_css_url IS 'URL to the sprite CSS file in Supabase Storage. Contains background-position rules for sprite images used in questions.';



















