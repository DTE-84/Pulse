import pg from 'pg';
import "dotenv/config";

const { Pool } = pg;

async function addIntentions() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("Adding intentions column to dim_users...");
    await pool.query(`
      ALTER TABLE public.dim_users 
      ADD COLUMN IF NOT EXISTS intentions JSONB DEFAULT '[]'::jsonb;
    `);
    console.log("✅ Column added.");
  } catch (err) {
    console.error("❌ Error adding column:", err);
  } finally {
    await pool.end();
  }
}

addIntentions();
