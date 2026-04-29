import pg from 'pg';
import fs from 'fs';
import path from 'path';
import "dotenv/config";

const { Pool } = pg;

async function applyFix() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("Reading SUPABASE_FIX.sql...");
    const sqlPath = path.join(process.cwd(), 'sql', 'SUPABASE_FIX.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log("Applying migration to Supabase...");
    await pool.query(sql);
    console.log("✅ Migration applied successfully. UUID schema is now active.");
  } catch (err) {
    console.error("❌ Failed to apply migration:", err);
  } finally {
    await pool.end();
  }
}

applyFix();
