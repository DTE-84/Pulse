-- CONSOLIDATED RLS POLICIES: Pulse-Ai dim_users
-- This script removes redundant policies and establishes a single source of truth.

BEGIN;

-- 1. DROP ALL EXISTING POLICIES for dim_users
DROP POLICY IF EXISTS "Identity_Nexus" ON public.dim_users;
DROP POLICY IF EXISTS "dim_users_select_own" ON public.dim_users;
DROP POLICY IF EXISTS "dim_users_insert_own" ON public.dim_users;
DROP POLICY IF EXISTS "dim_users_update_own" ON public.dim_users;
DROP POLICY IF EXISTS "dim_users_delete_own" ON public.dim_users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.dim_users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.dim_users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.dim_users;

-- 2. ENABLE RLS
ALTER TABLE public.dim_users ENABLE ROW LEVEL SECURITY;

-- 3. CREATE CLEAN UNIFIED POLICIES
-- SELECT: Users can only see their own row
CREATE POLICY "dim_users_select" ON public.dim_users
    FOR SELECT USING (auth.uid() = user_id);

-- INSERT: Users can only insert their own row
CREATE POLICY "dim_users_insert" ON public.dim_users
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own row
CREATE POLICY "dim_users_update" ON public.dim_users
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. ENSURE ALL TABLES HAVE CONSISTENT POLICIES
-- fact_transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.fact_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.fact_transactions;
CREATE POLICY "fact_transactions_select" ON public.fact_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "fact_transactions_insert" ON public.fact_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fact_transactions_delete" ON public.fact_transactions FOR DELETE USING (auth.uid() = user_id);

COMMIT;
