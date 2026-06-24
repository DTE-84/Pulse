import "dotenv/config";
import { query } from "./db/db.js";

async function run() {
  try {
    const nullDates = await query("SELECT COUNT(*) FROM fact_transactions WHERE purchase_date IS NULL");
    console.log("Transactions with NULL purchase_date:", nullDates.rows[0].count);
    
    const allDays = await query("SELECT TO_CHAR(purchase_date, 'DY') as day FROM fact_transactions");
    let hasNull = false;
    for (const r of allDays.rows) {
      if (!r.day) {
        hasNull = true;
      }
    }
    console.log("Any null or empty days?", hasNull);

  } catch (e) {
    console.error("error:", e);
  }
  process.exit(0);
}
run();
