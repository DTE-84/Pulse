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
    console.log("Adding UNIQUE constraint to plaid_item_id if missing...");
    await pool.query(`
      ALTER TABLE public.plaid_items 
      ADD CONSTRAINT unique_plaid_item_id UNIQUE (plaid_item_id);
    `);
    console.log("Unique constraint added!");
  } catch (err: any) {
    if (err.message.includes('already exists')) {
      console.log("Constraint already exists.");
    } else {
      console.error("General error:", err.message);
    }
  } finally {
    await pool.end();
  }
}

run();
