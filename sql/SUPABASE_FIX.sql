-- DEFINITIVE FIX: Unified Pulse-Ai Schema (UUID Based)
-- This script fixes the 400 Bad Request errors by aligning the database with the UUIDs sent by the frontend.
-- Run this in your Supabase SQL Editor.

BEGIN;

-- 1. Create temporary columns if they don't exist
ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS user_id_new uuid;
ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS initial_balance DECIMAL(12, 2) DEFAULT 15000.00;
ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(12, 2) DEFAULT 5200.00;
ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS nova_tone VARCHAR(50) DEFAULT 'Balanced';

-- 2. Handle the User ID migration
-- If user_id is currently an integer, we need to convert it to UUID to match Supabase Auth.
-- NOTE: If you have existing data linked by the integer user_id, you should backup first.

DO $$ 
BEGIN 
    -- Check if user_id is integer
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'dim_users' AND column_name = 'user_id') = 'integer' THEN
        -- Rename old column
        ALTER TABLE public.dim_users RENAME COLUMN user_id TO user_id_old;
        -- Add new UUID column as user_id
        ALTER TABLE public.dim_users ADD COLUMN user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE;
        -- If you had user_id_uuid from a previous partial fix, use that
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dim_users' AND column_name = 'user_id_uuid') THEN
            UPDATE public.dim_users SET user_id = user_id_uuid WHERE user_id_uuid IS NOT NULL;
        END IF;
    END IF;
END $$;

-- 3. Fix fact_transactions if needed
DO $$ 
BEGIN 
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'fact_transactions' AND column_name = 'user_id') = 'integer' THEN
        ALTER TABLE public.fact_transactions RENAME COLUMN user_id TO user_id_old;
        ALTER TABLE public.fact_transactions ADD COLUMN user_id uuid REFERENCES public.dim_users(user_id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Fix other tables
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dim_goals') AND 
       (SELECT data_type FROM information_schema.columns WHERE table_name = 'dim_goals' AND column_name = 'user_id') = 'integer' THEN
        ALTER TABLE public.dim_goals RENAME COLUMN user_id TO user_id_old;
        ALTER TABLE public.dim_goals ADD COLUMN user_id uuid REFERENCES public.dim_users(user_id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Ensure all core columns exist on dim_users
ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS user_name VARCHAR(100);
ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS baseline_spend DECIMAL(10, 2) DEFAULT 2500.00;

-- 6. Re-apply RLS Policies (Fixing any references to old columns)
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
