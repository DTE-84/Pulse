import { query } from "./db.js";

async function checkTriggers() {
  try {
    console.log("[PULSE DIAGNOSTIC] Checking triggers on auth.users...");
    // Need to use raw query for pg_trigger since it's in another schema but usually accessible
    const res = await query(`
      SELECT tgname as trigger_name, tgenabled as enabled
      FROM pg_trigger
      WHERE tgrelid = 'auth.users'::regclass
    `);
    console.log("--- auth.users triggers ---");
    res.rows.forEach(r => console.log(`${r.trigger_name} (Enabled: ${r.enabled})`));
  } catch (err) {
    console.error("[PULSE DIAGNOSTIC] Trigger check failed:", err.message);
  } finally {
    process.exit(0);
  }
}

checkTriggers();
