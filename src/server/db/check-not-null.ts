import pg from 'pg';
import "dotenv/config";

const { Pool } = pg;

async function checkNotNull() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("\n--- NOT NULL Constraints for dim_users ---");
    const res = await pool.query(`
      SELECT column_name, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'dim_users' 
      AND is_nullable = 'NO';
    `);
    console.table(res.rows);
  } catch (err) {
    console.error("❌ Error checking constraints:", err);
  } finally {
    await pool.end();
  }
}

checkNotNull();
