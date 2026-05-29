-- ============================================================
-- AI Agent feature migration
-- Run in Supabase SQL Editor
-- ============================================================

-- Track per-user agent_used in profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS agent_used INTEGER DEFAULT 0;

-- Conversations
CREATE TABLE IF NOT EXISTS agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New conversation',
  contract_text TEXT,
  contract_filename TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_conversations_user_idx ON agent_conversations(user_id);
CREATE INDEX IF NOT EXISTS agent_conversations_updated_idx ON agent_conversations(updated_at DESC);

ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own conversations" ON agent_conversations;
CREATE POLICY "Users can view own conversations"
  ON agent_conversations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own conversations" ON agent_conversations;
CREATE POLICY "Users can insert own conversations"
  ON agent_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON agent_conversations;
CREATE POLICY "Users can update own conversations"
  ON agent_conversations FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own conversations" ON agent_conversations;
CREATE POLICY "Users can delete own conversations"
  ON agent_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Messages
CREATE TABLE IF NOT EXISTS agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_messages_conv_idx ON agent_messages(conversation_id, created_at);

ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in own conversations" ON agent_messages;
CREATE POLICY "Users can view messages in own conversations"
  ON agent_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agent_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );
