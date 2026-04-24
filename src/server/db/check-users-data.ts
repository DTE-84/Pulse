import pg from 'pg';
import "dotenv/config";

const { Pool } = pg;

async function checkUsers() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const res = await pool.query("SELECT user_id, user_name, email, user_id_uuid FROM dim_users");
    console.log("Existing users in dim_users:", res.rows);
  } catch (err) {
    console.error("Error checking users:", err);
  } finally {
    await pool.end();
  }
}

checkUsers();
