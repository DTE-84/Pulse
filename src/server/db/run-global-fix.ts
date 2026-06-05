import getPool, { query } from './db.js';

async function runGlobalFix() {
  try {
    console.log("Applying global UUID mapping fix to Pulse DB...");
    
    await query(`
      BEGIN;

      -- 1. dim_users additions
      ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS user_id_uuid uuid DEFAULT gen_random_uuid();
      ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
      ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS initial_balance DECIMAL(12, 2) DEFAULT 15000.00;
      ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(12, 2) DEFAULT 5200.00;
      ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

      -- 2. fact_transactions additions
      ALTER TABLE public.fact_transactions ADD COLUMN IF NOT EXISTS user_id_uuid uuid;

      -- 3. dim_goals additions
      ALTER TABLE public.dim_goals ADD COLUMN IF NOT EXISTS user_id_uuid uuid;

      -- 4. threads additions (if they exist)
      -- Check if threads table exists first or just try-catch it
      
      COMMIT;
    `);

    console.log("✅ Global schema columns fixed.");
  } catch (err) {
    console.error("❌ Error applying fix:", err);
  } finally {
    await getPool().end();
  }
}

runGlobalFix();
