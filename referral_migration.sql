-- ============================================================
-- REFERRAL SYSTEM + BADGES MIGRATION for SKIL MATRIX
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add referral & badge columns to existing profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::jsonb;

-- 2. Create referral_visits table to track unique visits
CREATE TABLE IF NOT EXISTS referral_visits (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code TEXT NOT NULL,
  visitor_hash  TEXT,            -- hashed visitor fingerprint for dedup
  visited_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS so anon key can write
ALTER TABLE referral_visits DISABLE ROW LEVEL SECURITY;
GRANT ALL ON referral_visits TO anon;
GRANT ALL ON referral_visits TO authenticated;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_referral_visits_code ON referral_visits(referral_code);

-- 3. Verify
SELECT 'referral columns added' AS status,
       column_name
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('referral_code','referral_count','referral_points','badges');

SELECT 'referral_visits table' AS status, COUNT(*) AS rows FROM referral_visits;
