import pg from 'pg';
import "dotenv/config";

const { Pool } = pg;

async function checkSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const tables = ['dim_users', 'fact_transactions', 'dim_goals'];
    for (const table of tables) {
      console.log(`\n--- Schema for ${table} ---`);
      const res = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [table]);
      console.table(res.rows);
    }
  } catch (err) {
    console.error("❌ Error checking schema:", err);
  } finally {
    await pool.end();
  }
}

checkSchema();
