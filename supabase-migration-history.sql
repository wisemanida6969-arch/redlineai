-- ============================================================
-- Scan history migration
-- Run in Supabase SQL Editor
-- ============================================================

-- Vendor risk scans history
CREATE TABLE IF NOT EXISTS vendor_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  overall_score TEXT NOT NULL,                -- 'high' | 'medium' | 'low'
  overview TEXT,
  result JSONB NOT NULL,                       -- full report
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vendor_scans_user_idx ON vendor_scans(user_id);
CREATE INDEX IF NOT EXISTS vendor_scans_created_idx ON vendor_scans(created_at DESC);

ALTER TABLE vendor_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own vendor scans" ON vendor_scans;
CREATE POLICY "Users can view own vendor scans"
  ON vendor_scans FOR SELECT
  USING (auth.uid() = user_id);
