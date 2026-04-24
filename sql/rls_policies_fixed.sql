-- Unified RLS Policies for Pulse-Ai
-- Ensures Data Integrity and Privacy across all High-Fidelity tables.

-- Enable RLS on all public tables
ALTER TABLE public.dim_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dim_goals ENABLE ROW LEVEL SECURITY;

-- ── 1. dim_users Policies ───────────────────────────────────────────────────
CREATE POLICY "Users can view own profile" ON public.dim_users
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.dim_users
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.dim_users
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── 2. fact_transactions Policies ──────────────────────────────────────────
CREATE POLICY "Users can view own transactions" ON public.fact_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.fact_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON public.fact_transactions
    FOR DELETE USING (auth.uid() = user_id);

-- ── 3. threads Policies ──────────────────────────────────────────────────────
CREATE POLICY "Users can view own threads" ON public.threads
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own threads" ON public.threads
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own threads" ON public.threads
    FOR DELETE USING (auth.uid() = created_by);

-- ── 4. messages Policies ─────────────────────────────────────────────────────
CREATE POLICY "Users can view own messages" ON public.messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── 5. dim_goals Policies ──────────────────────────────────────────────────
CREATE POLICY "Users can view own goals" ON public.dim_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON public.dim_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON public.dim_goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON public.dim_goals
    FOR DELETE USING (auth.uid() = user_id);
