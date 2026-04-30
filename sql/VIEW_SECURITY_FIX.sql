-- Fix 3: Harden views with security_invoker
-- Ensures views respect RLS policies of the underlying tables (dim_users, fact_transactions).

BEGIN;

-- 1. view_user_segmentation
DROP VIEW IF EXISTS public.view_user_segmentation;
CREATE OR REPLACE VIEW public.view_user_segmentation 
WITH (security_invoker = on)
AS
SELECT 
    u.user_name,
    COUNT(f.transaction_id) as total_purchases,
    SUM(f.amount) as lifetime_spend,
    CASE 
        WHEN SUM(f.amount) > (u.baseline_spend * 5) THEN 'High-Velocity Spender'
        WHEN SUM(f.amount) < u.baseline_spend THEN 'Strategic Saver'
        ELSE 'Balanced Rhythm'
    END AS behavioral_segment
FROM public.fact_transactions f
JOIN public.dim_users u ON f.user_id = u.user_id
GROUP BY u.user_id, u.user_name, u.baseline_spend;

-- 2. view_behavioral_drift
DROP VIEW IF EXISTS public.view_behavioral_drift;
CREATE OR REPLACE VIEW public.view_behavioral_drift 
WITH (security_invoker = on)
AS
WITH LastPurchase AS (
    SELECT
        user_id,
        MAX(purchase_date) as last_order_date
    FROM public.fact_transactions
    GROUP BY user_id
)
SELECT
    u.user_name,
    lp.last_order_date,
    CURRENT_DATE - lp.last_order_date::DATE AS days_since_last_pulse,
    CASE
        WHEN CURRENT_DATE - lp.last_order_date::DATE > 30 THEN 'Pulse Stalled (Churned)'
        WHEN CURRENT_DATE - lp.last_order_date::DATE > 7 THEN 'Rhythm Drifting (At Risk)'
        ELSE 'Pulse Active'
    END as behavioral_status
FROM LastPurchase lp
JOIN public.dim_users u ON lp.user_id = u.user_id;

-- 3. Validation: Confirm RLS is enabled on base tables
ALTER TABLE public.dim_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_transactions ENABLE ROW LEVEL SECURITY;

COMMIT;

/*
QUICK SANITY TESTS:
1. Logged-in User Test:
   Query: SELECT * FROM view_user_segmentation;
   Expected: Only returns the record for the authenticated user (auth.uid()).

2. Anonymous User Test:
   Query: SELECT * FROM view_user_segmentation;
   Expected: Returns 0 rows (RLS on underlying tables prevents access).

3. Privilege Check:
   The view no longer uses the permissions of the view creator (SECURITY DEFINER),
   but instead uses the permissions of the user querying it (SECURITY INVOKER).
*/
