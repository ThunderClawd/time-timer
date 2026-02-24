-- Run this in your Supabase SQL editor (or use Supabase CLI migrations)

-- User preferences table: stores preferences + theme collection per user
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  preferences JSONB NOT NULL DEFAULT '{}',
  theme_collection JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row-level security: users can only access their own row
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for faster lookups (user_id is already the PK, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_user_preferences_updated_at
  ON user_preferences (updated_at DESC);
