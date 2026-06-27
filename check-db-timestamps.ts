import dotenv from 'dotenv';
dotenv.config();
import { query } from './src/server/db/db.js';
import getPoolPkg from './src/server/db/db.js';
const { getPool } = getPoolPkg;

async function check() {
  try {
    console.log("--- Querying DB Server Time ---");
    const timeRes = await query("SELECT NOW(), CURRENT_TIMESTAMP, CURRENT_DATE");
    console.log("Database NOW():", timeRes.rows[0].now);
    console.log("Database CURRENT_DATE:", timeRes.rows[0].current_date);
    
    console.log("\n--- Querying Synthetic Transactions timestamps ---");
    
    // Check recent transaction timestamps
    const res = await query(`
      SELECT 
        transaction_id,
        user_id,
        amount,
        purchase_date,
        merchant_name,
        external_id
      FROM fact_transactions 
      WHERE is_synthetic = true 
      ORDER BY purchase_date DESC 
      LIMIT 10
    `);
    
    console.log("\nMost recent 10 synthetic transactions in DB:");
    console.table(res.rows);

    // Group transactions by day to verify seeding spread vs. recent ones
    const resDaily = await query(`
      SELECT 
        purchase_date::date as date_day, 
        COUNT(*) as count
      FROM fact_transactions 
      WHERE is_synthetic = true
      GROUP BY date_day
      ORDER BY date_day DESC
      LIMIT 5
    `);
    
    console.log("\nRecent synthetic transactions count grouped by day:");
    console.table(resDaily.rows);
  } catch (err: any) {
    console.error("❌ Error:", err.message);
  } finally {
    await getPool().end();
  }
}

check();
