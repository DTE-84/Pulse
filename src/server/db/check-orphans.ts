import { query } from "./db.js";

async function checkOrphans() {
  try {
    console.log("[PULSE DIAGNOSTIC] Searching for orphaned guest records...");
    const res = await query(`
      SELECT user_id, email, user_name 
      FROM public.dim_users 
      WHERE email LIKE 'guest_%' OR email LIKE '%@pulse.demo'
    `);
    console.log("--- dim_users orphaned/guest records ---");
    res.rows.forEach(r => console.log(`ID: ${r.user_id} | Email: ${r.email}`));
  } catch (err) {
    console.error("[PULSE DIAGNOSTIC] Check failed:", err.message);
  } finally {
    process.exit(0);
  }
}

checkOrphans();
