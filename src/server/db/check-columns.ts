import { query } from "./db.js";

async function checkSchema() {
  try {
    console.log("[PULSE DIAGNOSTIC] Checking columns for dim_users...");
    const res = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'dim_users'
    `);
    console.log("--- dim_users columns ---");
    res.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));
  } catch (err) {
    console.error("[PULSE DIAGNOSTIC] Schema check failed:", err.message);
  } finally {
    process.exit(0);
  }
}

checkSchema();
