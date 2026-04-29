import pg from 'pg';
import fs from 'fs';
import path from 'path';
import "dotenv/config";

const { Pool } = pg;

async function syncUsers() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("Reading SYNC_USERS.sql...");
    const sqlPath = path.join(process.cwd(), 'sql', 'SYNC_USERS.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log("Applying user synchronization and trigger to Supabase...");
    await pool.query(sql);
    console.log("✅ Users synchronized and automation trigger established.");
  } catch (err) {
    console.error("❌ Failed to sync users:", err);
  } finally {
    await pool.end();
  }
}

syncUsers();
