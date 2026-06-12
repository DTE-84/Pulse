-- MIGRATION: Add Missing Behavioral & Subscription Columns
-- Date: 2026-06-11
-- Target: dim_users

BEGIN;

ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trialing';
ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'trial';
ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days');
ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS plaid_env VARCHAR(50) DEFAULT 'sandbox';
ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS intentions TEXT;

-- Update existing users if necessary
UPDATE public.dim_users 
SET 
  subscription_status = 'trialing',
  subscription_tier = 'trial',
  trial_started_at = NOW(),
  trial_ends_at = NOW() + INTERVAL '7 days'
WHERE subscription_status IS NULL;

COMMIT;
