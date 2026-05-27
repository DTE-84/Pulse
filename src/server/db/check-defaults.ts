import pg from 'pg';
import "dotenv/config";

const { Pool } = pg;

async function checkDefaults() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const res = await pool.query(`
      SELECT column_name, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'dim_users'
    `);
    console.table(res.rows);
  } catch (err) {
    console.error("❌ Error checking defaults:", err);
  } finally {
    await pool.end();
  }
}

checkDefaults();
