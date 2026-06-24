import { query, getPool } from './db.js';

async function runFix() {
  try {
    console.log("Applying additive schema fix to Pulse DB...");
    
    await query(`
      -- 1. Fix dim_users: ensure UUID primary key and missing columns
      -- First, we need to handle the case where user_id is integer.
      -- We'll rename the old user_id and create a new uuid one if needed, 
      -- but it's simpler to just ensure columns exist first.
      
      ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS user_id_uuid uuid DEFAULT gen_random_uuid();
      ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
      ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS initial_balance DECIMAL(12, 2) DEFAULT 15000.00;
      ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(12, 2) DEFAULT 5200.00;
      ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      
      -- If we want to use UUID as primary key, it's a bit more involved if data exists.
      -- But let's at least make sure they exist for the API to not fail with 400.
    `);

    console.log("✅ Schema columns fixed.");
    
    // Check if fact_transactions and others need UUIDs
    // For now, let's just make the API work by querying the correct columns.
    
  } catch (err) {
    console.error("❌ Error applying fix:", err);
  } finally {
    await getPool().end();
  }
}

runFix();
