-- Run this in Supabase SQL Editor to add per-feature usage tracking

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS quote_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vendor_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS esign_used INTEGER DEFAULT 0;

-- scans_used remains the Contract Analysis counter
-- scan_month remains the month tracker for all features

-- Optional: backfill defaults for existing rows
UPDATE profiles
SET quote_used = COALESCE(quote_used, 0),
    vendor_used = COALESCE(vendor_used, 0),
    esign_used = COALESCE(esign_used, 0);
