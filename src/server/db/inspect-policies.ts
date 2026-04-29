import pg from 'pg';
import "dotenv/config";

const { Pool } = pg;

async function checkPolicies() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("\n--- RLS Policies for dim_users ---");
    const res = await pool.query(`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'dim_users';
    `);
    console.table(res.rows);
  } catch (err) {
    console.error("❌ Error checking policies:", err);
  } finally {
    await pool.end();
  }
}

checkPolicies();
