import { query } from './db.js';

async function checkDefault() {
  try {
    const res = await query(`
      SELECT column_name, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'dim_users' AND column_name = 'user_id'
    `);
    console.log("Default for user_id:", res.rows[0]);
  } catch (err) {
    console.error("Error:", err);
  }
}

checkDefault();
