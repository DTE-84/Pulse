import pg from 'pg';
import "dotenv/config";

const { Pool } = pg;

async function reloadSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("Forcing Supabase PostgREST schema reload...");
    // Calling NOTIFY pgrst, 'reload' tells Supabase to refresh its API cache
    await pool.query("NOTIFY pgrst, 'reload'");
    console.log("✅ Reload signal sent.");
  } catch (err) {
    console.error("❌ Failed to send reload signal:", err);
  } finally {
    await pool.end();
  }
}

reloadSchema();
