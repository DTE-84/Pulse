import { query } from "./db.js";

async function checkConstraints() {
  try {
    console.log("[PULSE DIAGNOSTIC] Checking constraints for dim_users...");
    const res = await query(`
      SELECT column_name, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'dim_users'
    `);
    console.log("--- dim_users constraints ---");
    res.rows.forEach(r => {
      console.log(`${r.column_name}: Nullable=${r.is_nullable}, Default=${r.column_default}`);
    });
  } catch (err) {
    console.error("[PULSE DIAGNOSTIC] Constraint check failed:", err.message);
  } finally {
    process.exit(0);
  }
}

checkConstraints();
