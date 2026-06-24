import { query } from "./db.js";

async function checkDimUsersTriggers() {
  try {
    console.log("[PULSE DIAGNOSTIC] Checking triggers on dim_users...");
    const res = await query(`
      SELECT tgname as trigger_name, tgenabled as enabled
      FROM pg_trigger
      WHERE tgrelid = 'public.dim_users'::regclass
    `);
    console.log("--- dim_users triggers ---");
    res.rows.forEach(r => console.log(`${r.trigger_name} (Enabled: ${r.enabled})`));
  } catch (err) {
    console.error("[PULSE DIAGNOSTIC] Trigger check failed:", err.message);
  } finally {
    process.exit(0);
  }
}

checkDimUsersTriggers();
