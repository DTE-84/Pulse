import { query } from "./db.js";

async function checkFunction() {
  try {
    console.log("[PULSE DIAGNOSTIC] Checking function definition: handle_new_user...");
    const res = await query(`
      SELECT prosrc 
      FROM pg_proc 
      WHERE proname = 'handle_new_user'
    `);
    console.log("--- handle_new_user definition ---");
    if (res.rows.length > 0) {
      console.log(res.rows[0].prosrc);
    } else {
      console.log("Function not found.");
    }
  } catch (err) {
    console.error("[PULSE DIAGNOSTIC] Function check failed:", err.message);
  } finally {
    process.exit(0);
  }
}

checkFunction();
