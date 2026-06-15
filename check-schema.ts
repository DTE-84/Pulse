import dotenv from 'dotenv';
dotenv.config();
import { query } from './src/server/db/db.js';
import getPoolPkg from './src/server/db/db.js';
const { getPool } = getPoolPkg;

async function checkSchema() {
  try {
    console.log("Checking dim_users schema...");
    const res = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'dim_users'");
    console.table(res.rows);
    
    console.log("\nChecking for specific user 'drew.t.ernst@gmail.com'...");
    const userRes = await query("SELECT user_id, email, user_name FROM dim_users WHERE email = 'drew.t.ernst@gmail.com'");
    if (userRes.rows.length > 0) {
      console.log("✅ User found in dim_users:");
      console.table(userRes.rows);
    } else {
      console.log("❌ User NOT found in dim_users.");
    }
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await getPool().end();
  }
}

checkSchema();
