import getPool, { query } from './db.js';

async function reloadSchema() {
  try {
    console.log("Forcing Supabase PostgREST schema reload...");
    // Calling NOTIFY pgrst, 'reload' tells Supabase to refresh its API cache
    await query("NOTIFY pgrst, 'reload'");
    console.log("✅ Reload signal sent.");
  } catch (err) {
    console.error("❌ Failed to send reload signal:", err);
  } finally {
    await getPool().end();
  }
}

reloadSchema();
