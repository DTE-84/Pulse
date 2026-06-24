import { query } from "./db.js";

async function checkGlobalTriggers() {
  try {
    console.log("[PULSE DIAGNOSTIC] Searching for ALL AFTER INSERT triggers...");
    const res = await query(`
      SELECT 
        event_object_schema as schema,
        event_object_table as table_name,
        trigger_name,
        action_statement as definition
      FROM information_schema.triggers
      WHERE event_manipulation = 'INSERT' AND action_timing = 'AFTER'
    `);
    console.log("--- Global AFTER INSERT triggers ---");
    res.rows.forEach(r => {
      console.log(`${r.schema}.${r.table_name} | ${r.trigger_name}`);
    });
  } catch (err) {
    console.error("[PULSE DIAGNOSTIC] Global search failed:", err.message);
  } finally {
    process.exit(0);
  }
}

checkGlobalTriggers();
