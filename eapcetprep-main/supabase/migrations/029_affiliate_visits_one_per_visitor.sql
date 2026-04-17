-- Ensure only one visit is counted per unique visitor per affiliate.
-- A "visitor" is identified by a fingerprint (hash of IP + User-Agent).

BEGIN;

-- 1️⃣ Add visitor_fingerprint column if it does not exist
ALTER TABLE affiliate_visits
ADD COLUMN IF NOT EXISTS visitor_fingerprint VARCHAR(64);

-- 2️⃣ Backfill fingerprint using IP + User Agent
UPDATE affiliate_visits
SET visitor_fingerprint = md5(
    COALESCE(visitor_ip, '') || '|' || COALESCE(user_agent, '')
)
WHERE visitor_fingerprint IS NULL;

-- 3️⃣ Fallback for any remaining NULL values (extremely rare edge case)
UPDATE affiliate_visits
SET visitor_fingerprint = md5(id::text)
WHERE visitor_fingerprint IS NULL;

-- 4️⃣ Remove duplicate visits
-- Keeps the earliest created_at per (affiliate_id, visitor_fingerprint)
DELETE FROM affiliate_visits a
USING affiliate_visits b
WHERE a.id <> b.id
AND a.affiliate_id = b.affiliate_id
AND a.visitor_fingerprint = b.visitor_fingerprint
AND a.created_at > b.created_at;

-- 5️⃣ Make fingerprint NOT NULL
ALTER TABLE affiliate_visits
ALTER COLUMN visitor_fingerprint SET NOT NULL;

-- 6️⃣ Remove old constraint if exists
ALTER TABLE affiliate_visits
DROP CONSTRAINT IF EXISTS unique_affiliate_visitor;

-- 7️⃣ Add unique constraint to prevent future duplicates
ALTER TABLE affiliate_visits
ADD CONSTRAINT unique_affiliate_visitor
UNIQUE (affiliate_id, visitor_fingerprint);

-- 8️⃣ Add documentation
COMMENT ON COLUMN affiliate_visits.visitor_fingerprint 
IS 'Hash of IP + User-Agent to dedupe visits; one row per (affiliate, visitor) only.';

COMMIT;
