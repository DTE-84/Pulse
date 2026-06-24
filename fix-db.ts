import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log("Adding columns to fact_transactions...");
    await pool.query(`
      ALTER TABLE public.fact_transactions 
      ADD COLUMN IF NOT EXISTS merchant_name VARCHAR(255);
      
      ALTER TABLE public.fact_transactions 
      ADD COLUMN IF NOT EXISTS external_id VARCHAR(255) UNIQUE;
    `);
    console.log("fact_transactions updated!");

    console.log("Checking plaid_items item_id default...");
    await pool.query(`
      ALTER TABLE public.plaid_items 
      ALTER COLUMN item_id SET DEFAULT gen_random_uuid();
    `);
    console.log("plaid_items item_id default set!");

    // Also fix plaid_secrets just in case
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.plaid_secrets (
        secret_id SERIAL PRIMARY KEY,
        item_id uuid REFERENCES public.plaid_items(item_id) ON DELETE CASCADE UNIQUE,
        access_token_encrypted TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log("plaid_secrets ensured!");

    console.log("All DB fixes applied successfully!");
  } catch (err: any) {
    console.error("General error:", err.message);
  } finally {
    await pool.end();
  }
}

run();
