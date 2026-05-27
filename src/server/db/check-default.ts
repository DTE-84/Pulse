import pg from 'pg';
import "dotenv/config";

const { Pool } = pg;

async function checkDefault() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const res = await pool.query(`
      SELECT column_name, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'dim_users' AND column_name = 'user_id'
    `);
    console.log("Default for user_id:", res.rows[0]);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

checkDefault();
