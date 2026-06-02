-- Pulse-Ai: High-Performance Nexus RLS Policies
-- Optimized with (select auth.uid()) to prevent per-row function re-evaluation.
-- Establish "Nexus" naming convention for core identity and messaging tables.

BEGIN;

-- ── 1. dim_users (Identity Nexus) ─────────────────────────────────────────────
ALTER TABLE public.dim_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Identity_Nexus" ON public.dim_users;
DROP POLICY IF EXISTS "dim_users_select" ON public.dim_users;
DROP POLICY IF EXISTS "dim_users_insert" ON public.dim_users;
DROP POLICY IF EXISTS "dim_users_update" ON public.dim_users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.dim_users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.dim_users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.dim_users;

CREATE POLICY "Identity_Nexus" ON public.dim_users
    FOR ALL
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);


-- ── 2. threads (Conversation Nexus) ───────────────────────────────────────────
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Threads_Nexus" ON public.threads;
DROP POLICY IF EXISTS "Users can view own threads" ON public.threads;
DROP POLICY IF EXISTS "Users can insert own threads" ON public.threads;
DROP POLICY IF EXISTS "Users can delete own threads" ON public.threads;

CREATE POLICY "Threads_Nexus" ON public.threads
    FOR ALL
    USING ((select auth.uid()) = created_by)
    WITH CHECK ((select auth.uid()) = created_by);


-- ── 3. messages (Communication Nexus) ─────────────────────────────────────────
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Messages_Nexus" ON public.messages;
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON public.messages;

CREATE POLICY "Messages_Nexus" ON public.messages
    FOR ALL
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);


-- ── 4. fact_transactions (Financial Nexus) ────────────────────────────────────
ALTER TABLE public.fact_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Transactions_Nexus" ON public.fact_transactions;
DROP POLICY IF EXISTS "fact_transactions_select" ON public.fact_transactions;
DROP POLICY IF EXISTS "fact_transactions_insert" ON public.fact_transactions;
DROP POLICY IF EXISTS "fact_transactions_delete" ON public.fact_transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.fact_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.fact_transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.fact_transactions;

CREATE POLICY "Transactions_Nexus" ON public.fact_transactions
    FOR ALL
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);


-- ── 5. dim_goals (Objective Nexus) ────────────────────────────────────────────
ALTER TABLE public.dim_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Objectives_Nexus" ON public.dim_goals;
DROP POLICY IF EXISTS "Users can view own goals" ON public.dim_goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON public.dim_goals;
DROP POLICY IF EXISTS "Users can update own goals" ON public.dim_goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON public.dim_goals;

CREATE POLICY "Objectives_Nexus" ON public.dim_goals
    FOR ALL
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);


-- ── 6. plaid_items (Banking Nexus) ────────────────────────────────────────────
ALTER TABLE public.plaid_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Plaid_Nexus" ON public.plaid_items;
DROP POLICY IF EXISTS "Users can view own plaid items" ON public.plaid_items;
DROP POLICY IF EXISTS "Users can insert own plaid items" ON public.plaid_items;
DROP POLICY IF EXISTS "Users can update own plaid items" ON public.plaid_items;
DROP POLICY IF EXISTS "Users can delete own plaid items" ON public.plaid_items;

CREATE POLICY "Plaid_Nexus" ON public.plaid_items
    FOR ALL
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);


-- ── 7. thread_summaries (Intelligence Nexus) ──────────────────────────────────
ALTER TABLE public.thread_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "thread_summaries_thread_owner_insert" ON public.thread_summaries;

CREATE POLICY "thread_summaries_thread_owner_insert" ON public.thread_summaries
    FOR INSERT 
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM threads t 
        WHERE t.id = thread_summaries.thread_id 
        AND t.created_by = (select auth.uid())
      )
    );

COMMIT;
