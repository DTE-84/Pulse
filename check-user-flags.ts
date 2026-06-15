import dotenv from 'dotenv';
dotenv.config();
import dbPkg from './src/server/db/db.js';
const { query, getPool } = dbPkg;

async function checkUserFlags() {
  try {
    const email = 'drew.t.ernst@gmail.com';
    const res = await query("SELECT user_id, email, is_demo, subscription_status FROM dim_users WHERE email = $1", [email]);
    console.table(res.rows);
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    const pool = getPool();
    if (pool) await pool.end();
  }
}

checkUserFlags();
