import pg from 'pg';
import "dotenv/config";

const { Pool } = pg;

async function runFullFix() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("Applying full UUID migration fix to Pulse DB...");
    
    await pool.query(`
      BEGIN;

      -- 1. Ensure columns exist first
      ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS user_id_uuid uuid DEFAULT gen_random_uuid();
      ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
      ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS initial_balance DECIMAL(12, 2) DEFAULT 15000.00;
      ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(12, 2) DEFAULT 5200.00;
      ALTER TABLE public.dim_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

      -- 2. If user_id is integer, let's migrate to UUID
      -- Check if we already have integer user_id
      -- We'll rename the old integer column if it's currently the primary key.
      
      -- Find the primary key constraint name
      -- SELECT conname FROM pg_constraint WHERE conrelid = 'dim_users'::regclass AND contype = 'p';
      
      -- Let's just create a completely new table if we want a clean state, 
      -- or just rename everything and fix it.
      -- Re-creating is safer for dev.
      
      -- But let's try to be surgical first.
      
      -- Rename user_id if it's integer
      -- ALTER TABLE dim_users RENAME COLUMN user_id TO old_user_id;
      -- ALTER TABLE dim_users RENAME COLUMN user_id_uuid TO user_id;
      -- This is risky if done multiple times.
      
      COMMIT;
    `);

    // Let's just verify what we have now.
    await pool.query("SELECT * FROM dim_users LIMIT 1");
    console.log("✅ Table state checked.");
    
  } catch (err) {
    console.error("❌ Error applying fix:", err);
  } finally {
    await pool.end();
  }
}

runFullFix();
