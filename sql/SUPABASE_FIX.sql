-- DEFINITIVE DATA INTEGRITY FIX: Pulse-Ai Schema (UUID Based)
-- This script migrates existing integer IDs to Supabase Auth UUIDs.
-- Run this in your Supabase SQL Editor.

BEGIN;

-- 1. Ensure core columns exist on dim_users
ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS user_id_uuid uuid;
ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS initial_balance DECIMAL(12, 2) DEFAULT 15000.00;
ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(12, 2) DEFAULT 5200.00;
ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS nova_tone VARCHAR(50) DEFAULT 'Balanced';

-- 2. Link existing users to Supabase Auth UUIDs via Email
UPDATE public.dim_users u
SET user_id_uuid = a.id
FROM auth.users a
WHERE u.email = a.email AND u.user_id_uuid IS NULL;

-- 3. Migrate Foreign Keys in fact_transactions
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fact_transactions' AND column_name = 'user_id_uuid') THEN
        ALTER TABLE public.fact_transactions ADD COLUMN user_id_uuid uuid;
    END IF;
END $$;

UPDATE public.fact_transactions t
SET user_id_uuid = u.user_id_uuid
FROM public.dim_users u
WHERE t.user_id = u.user_id AND t.user_id_uuid IS NULL;

-- 4. Migrate Foreign Keys in dim_goals
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dim_goals') AND 
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dim_goals' AND column_name = 'user_id_uuid') THEN
        ALTER TABLE public.dim_goals ADD COLUMN user_id_uuid uuid;
    END IF;
END $$;

UPDATE public.dim_goals g
SET user_id_uuid = u.user_id_uuid
FROM public.dim_users u
WHERE g.user_id = u.user_id AND g.user_id_uuid IS NULL;

-- 5. SWAP COLUMNS: Make UUID the Primary Key
-- This is the critical step to stop the 400 errors.

-- A. Remove old constraints
ALTER TABLE public.fact_transactions DROP CONSTRAINT IF EXISTS fact_transactions_user_id_fkey;
ALTER TABLE public.dim_goals DROP CONSTRAINT IF EXISTS dim_goals_user_id_fkey;

-- B. Rename columns to swap identities
ALTER TABLE public.dim_users RENAME COLUMN user_id TO user_id_int;
ALTER TABLE public.dim_users RENAME COLUMN user_id_uuid TO user_id;

ALTER TABLE public.fact_transactions RENAME COLUMN user_id TO user_id_int;
ALTER TABLE public.fact_transactions RENAME COLUMN user_id_uuid TO user_id;

DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dim_goals') THEN
        ALTER TABLE public.dim_goals RENAME COLUMN user_id TO user_id_int;
        ALTER TABLE public.dim_goals RENAME COLUMN user_id_uuid TO user_id;
    END IF;
END $$;

-- C. Set Primary Key on dim_users
ALTER TABLE public.dim_users DROP CONSTRAINT IF EXISTS dim_users_pkey;
ALTER TABLE public.dim_users ADD PRIMARY KEY (user_id);

-- D. Restore Foreign Keys
ALTER TABLE public.fact_transactions ADD CONSTRAINT fact_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.dim_users(user_id) ON DELETE CASCADE;

DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dim_goals') THEN
        ALTER TABLE public.dim_goals ADD CONSTRAINT dim_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.dim_users(user_id) ON DELETE CASCADE;
    END IF;
END $$;

-- 6. Re-apply RLS Policies
ALTER TABLE public.dim_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.dim_users;
CREATE POLICY "Users can view own profile" ON public.dim_users FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.dim_users;
CREATE POLICY "Users can update own profile" ON public.dim_users FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.dim_users;
CREATE POLICY "Users can insert own profile" ON public.dim_users FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.fact_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.fact_transactions;
CREATE POLICY "Users can view own transactions" ON public.fact_transactions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.fact_transactions;
CREATE POLICY "Users can insert own transactions" ON public.fact_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

COMMIT;
