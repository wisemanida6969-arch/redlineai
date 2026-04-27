-- ============================================================
-- Paddle billing migration
-- Run in Supabase SQL Editor
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS paddle_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT,        -- 'active' | 'paused' | 'canceled' | 'past_due'
  ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_price_id TEXT;

CREATE INDEX IF NOT EXISTS profiles_paddle_customer_idx ON profiles(paddle_customer_id);
CREATE INDEX IF NOT EXISTS profiles_paddle_subscription_idx ON profiles(paddle_subscription_id);
