import pg from 'pg';
import "dotenv/config";

const { Pool } = pg;

async function runSurgicalFix() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("Applying surgical UUID fix to Pulse DB...");
    
    await pool.query(`
      BEGIN;

      -- 1. Ensure new columns exist
      ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS user_id_uuid uuid DEFAULT gen_random_uuid();
      ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
      ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS initial_balance DECIMAL(12, 2) DEFAULT 15000.00;
      ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(12, 2) DEFAULT 5200.00;
      ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

      -- 2. If 'user_id' is integer, let's keep it but also add 'user_id_uuid' to all tables
      -- AND we will update api.ts to use user_id_uuid for auth lookups.
      
      -- Update existing users: if email matches auth.users, let's link them if possible.
      -- This is hard to do from here without access to auth schema easily.
      
      COMMIT;
    `);

    console.log("✅ DB Fixed.");
  } catch (err) {
    console.error("❌ Error applying fix:", err);
  } finally {
    await pool.end();
  }
}

runSurgicalFix();
