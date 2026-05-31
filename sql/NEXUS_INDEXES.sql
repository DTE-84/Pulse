-- Pulse-Ai: High-Performance Nexus Indexes
-- Supporting RLS policies by ensuring all lookup columns are indexed.
-- This ensures the (select auth.uid()) caching benefit is fully realized.

BEGIN;

-- ── 1. threads (created_by) ──────────────────────────────────────────────────
-- Required for "Threads_Nexus" policy
CREATE INDEX IF NOT EXISTS idx_threads_created_by ON public.threads(created_by);

-- ── 2. messages (user_id) ────────────────────────────────────────────────────
-- Required for "Messages_Nexus" policy
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);

-- ── 3. Verification of Existing Indexes ──────────────────────────────────────
-- These should already exist via schema_fixed.sql, but ensured here for parity.
CREATE INDEX IF NOT EXISTS idx_fact_transactions_user_id ON public.fact_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_dim_goals_user_id ON public.dim_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_items_user_id ON public.plaid_items(user_id);

COMMIT;
