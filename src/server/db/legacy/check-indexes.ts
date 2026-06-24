import { query } from "./db.js";

async function checkIndexes() {
  try {
    console.log("[PULSE DIAGNOSTIC] Checking indexes and constraints for dim_users...");
    const res = await query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'dim_users'
    `);
    console.log("--- dim_users indexes ---");
    res.rows.forEach(r => console.log(r.indexdef));
    
    const res2 = await query(`
      SELECT conname, pg_get_constraintdef(oid)
      FROM pg_constraint
      WHERE conrelid = 'dim_users'::regclass
    `);
    console.log("--- dim_users constraints ---");
    res2.rows.forEach(r => console.log(`${r.conname}: ${r.pg_get_constraintdef}`));
  } catch (err) {
    console.error("[PULSE DIAGNOSTIC] Check failed:", err.message);
  } finally {
    process.exit(0);
  }
}

checkIndexes();
