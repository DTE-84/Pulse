import { query } from "./db.js";

async function checkAllTriggers() {
  try {
    console.log("[PULSE DIAGNOSTIC] Exhaustive trigger audit for auth.users...");
    const res = await query(`
      SELECT 
        trig.tgname AS trigger_name,
        proc.proname AS function_name,
        pg_get_triggerdef(trig.oid) AS definition
      FROM pg_trigger trig
      JOIN pg_proc proc ON trig.tgfoid = proc.oid
      WHERE trig.tgrelid = 'auth.users'::regclass
    `);
    console.log("--- auth.users triggers (Full Audit) ---");
    res.rows.forEach(r => {
      console.log(`Trigger: ${r.trigger_name}`);
      console.log(`Function: ${r.function_name}`);
      console.log(`Def: ${r.definition}`);
      console.log('---');
    });
  } catch (err) {
    console.error("[PULSE DIAGNOSTIC] Audit failed:", err.message);
  } finally {
    process.exit(0);
  }
}

checkAllTriggers();
