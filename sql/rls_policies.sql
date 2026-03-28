-- Pulse: Row Level Security Policies
-- Run this in Supabase SQL Editor after enabling RLS on each table.
-- These policies ensure users can ONLY read and write their OWN data.

-- ── ENABLE RLS ON ALL TABLES ───────────────────────────────────────────────
ALTER TABLE dim_users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE fact_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads           ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages          ENABLE ROW LEVEL SECURITY;

-- ── dim_users ───────────────────────────────────────────────────────────────
-- Users may only see and update their own profile row.
CREATE POLICY users_select_own ON dim_users
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY users_update_own ON dim_users
  FOR UPDATE USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- ── fact_transactions ────────────────────────────────────────────────────────
-- Users may only select/insert their own transactions.
-- UPDATE and DELETE are intentionally excluded (financial audit trail).
CREATE POLICY transactions_select_own ON fact_transactions
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY transactions_insert_own ON fact_transactions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- ── threads ─────────────────────────────────────────────────────────────────
CREATE POLICY threads_select_own ON threads
  FOR SELECT USING (auth.uid()::text = created_by::text);

CREATE POLICY threads_insert_own ON threads
  FOR INSERT WITH CHECK (auth.uid()::text = created_by::text);

CREATE POLICY threads_delete_own ON threads
  FOR DELETE USING (auth.uid()::text = created_by::text);

-- ── messages ────────────────────────────────────────────────────────────────
CREATE POLICY messages_select_own ON messages
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY messages_insert_own ON messages
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- ── VERIFICATION QUERY ──────────────────────────────────────────────────────
-- Run this to confirm all policies are active:
-- SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname = 'public';