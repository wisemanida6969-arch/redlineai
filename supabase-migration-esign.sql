-- ============================================================
-- E-Signature feature migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- Signature requests (envelopes)
CREATE TABLE IF NOT EXISTS signature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,                    -- path in 'esign-documents' bucket
  signed_storage_path TEXT,                      -- path of completed PDF (after signing)
  status TEXT NOT NULL DEFAULT 'pending',        -- 'pending' | 'signed' | 'expired' | 'cancelled'
  signer_email TEXT NOT NULL,
  signer_name TEXT NOT NULL,
  fields JSONB NOT NULL,                         -- [{type, x, y, page, width, height}]
  token TEXT NOT NULL UNIQUE,                    -- public access token
  signed_at TIMESTAMPTZ,
  signed_ip TEXT,
  signature_image TEXT,                          -- base64 of signature
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS signature_requests_user_idx ON signature_requests(user_id);
CREATE INDEX IF NOT EXISTS signature_requests_token_idx ON signature_requests(token);

-- RLS
ALTER TABLE signature_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own signature requests" ON signature_requests;
CREATE POLICY "Users can view own signature requests"
  ON signature_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Service role bypasses RLS for signing flow (uses createServiceClient on backend)

-- ============================================================
-- Storage bucket setup
-- (also create via Supabase Dashboard > Storage > Create new bucket: esign-documents, private)
-- ============================================================
-- After creating the bucket in the Storage UI, run:

-- Allow service role to read/write (backend uses service role key, so RLS not strictly needed,
-- but you can allow authenticated users to read their own folder if desired)

-- Backfill: nothing to do for new feature
