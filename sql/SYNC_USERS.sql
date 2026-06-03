-- CLEAN & AUTOMATE: Pulse-Ai User Provisioning
-- 1. Remove legacy constraints and broken triggers
-- 2. Sync missing users
-- 3. Establish robust automation

BEGIN;

-- 1. DROP LEGACY CONSTRAINTS & TRIGGERS
-- Remove NOT NULL from password as we use Supabase Auth now
ALTER TABLE public.dim_users ALTER COLUMN password DROP NOT NULL;

-- Remove legacy triggers and functions
DROP FUNCTION IF EXISTS public.set_dim_users_user_id_uuid() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. Sync Missing Users from auth.users to public.dim_users
INSERT INTO public.dim_users (user_id, email, user_name, onboarding_completed, baseline_spend)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)), 
    false, 
    2500.00
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.dim_users)
ON CONFLICT (user_id) DO NOTHING;

-- 3. Create the Robust Automation Function
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.dim_users (user_id, email, user_name, onboarding_completed, baseline_spend, subscription_status, trial_ends_at)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
    false, 
    2500.00,
    'trialing',
    NOW() + INTERVAL '7 days'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

COMMIT;
