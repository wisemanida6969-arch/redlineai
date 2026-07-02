-- ============================================================
-- Beta monetization migration (2026-07)
-- 판례보기/업체스캔: 24시간 패스 또는 월 9,900원 멤버십(월 쿼터)
-- 나머지 기능(검토/초안작성/AI에이전트/표준계약서)은 베타 기간 전부 무료
-- ============================================================

-- Monthly view counter for the precedent feature (mirrors vendor_used's pattern,
-- shares the existing `scan_month` column as its reset marker).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS precedent_used INTEGER DEFAULT 0;

-- Normalize old paid tiers — no real paying customers exist yet (verified),
-- so this is safe. Going forward `plan` is just 'free' | 'member'.
UPDATE profiles SET plan = 'free' WHERE plan NOT IN ('free', 'member');

-- One-time 24-hour feature passes (판례보기 ₩3,900 / 업체스캔 ₩2,900).
CREATE TABLE IF NOT EXISTS feature_passes (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature                TEXT NOT NULL CHECK (feature IN ('precedent', 'vendor')),
  expires_at             TIMESTAMPTZ NOT NULL,
  paddle_transaction_id  TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feature_passes_user_feature_idx
  ON feature_passes(user_id, feature, expires_at);

-- Prevent granting the same pass twice for one Paddle transaction (webhook retries).
CREATE UNIQUE INDEX IF NOT EXISTS feature_passes_txn_idx
  ON feature_passes(paddle_transaction_id) WHERE paddle_transaction_id IS NOT NULL;

ALTER TABLE feature_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own passes select" ON feature_passes
  FOR SELECT USING (auth.uid() = user_id);
-- No INSERT/UPDATE policy for regular clients — all writes go through the
-- service-role client in the Paddle webhook handler, bypassing RLS.
