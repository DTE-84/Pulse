import getPool, { query } from './db.js';

async function checkUsers() {
  try {
    const res = await query("SELECT user_id, user_name, email, user_id_uuid FROM dim_users");
    console.log("Existing users in dim_users:", res.rows);
  } catch (err) {
    console.error("Error checking users:", err);
  } finally {
    await getPool().end();
  }
}

checkUsers();
