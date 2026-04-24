import pg from 'pg';
import "dotenv/config";

const { Pool } = pg;

async function checkSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const tables = ['dim_users', 'fact_transactions', 'dim_categories', 'dim_triggers', 'dim_goals'];
    for (const table of tables) {
      const res = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${table}'`);
      console.log(`Columns in ${table}:`, res.rows);
    }
  } catch (err) {
    console.error("Error checking schema:", err);
  } finally {
    await pool.end();
  }
}

checkSchema();
