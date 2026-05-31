import { query } from './db';

async function checkDimUsers() {
  try {
    const res = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'dim_users'");
    console.log("Columns in dim_users:", res.rows);
    
    const countRes = await query("SELECT COUNT(*) FROM dim_users");
    console.log("Total users in dim_users:", countRes.rows[0].count);
  } catch (err) {
    console.error("Error checking dim_users:", err);
  }
}

checkDimUsers();
