import pg from 'pg';
import "dotenv/config";

const { Pool } = pg;

async function checkDimUsers() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'dim_users'");
    console.log("Columns in dim_users:", res.rows);
    
    const countRes = await pool.query("SELECT COUNT(*) FROM dim_users");
    console.log("Total users in dim_users:", countRes.rows[0].count);
  } catch (err) {
    console.error("Error checking dim_users:", err);
  } finally {
    await pool.end();
  }
}

checkDimUsers();
