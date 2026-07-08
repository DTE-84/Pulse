import { query } from "../src/server/db/db.js";

async function clearOldSynthetic() {
    console.log("Clearing synthetic transactions from before the fix...");
    const res = await query("DELETE FROM fact_transactions WHERE is_synthetic = true");
    console.log(`Deleted ${res.rowCount} synthetic transactions.`);
    console.log("Run the seeder again from the dashboard to repopulate 30 days realistically.");
}

clearOldSynthetic().catch(console.error);
