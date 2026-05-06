import "dotenv/config";
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function check() {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'dim_users'");
    console.log("Columns in dim_users:", res.rows.map(r => r.column_name).join(", "));
    process.exit(0);
  } catch (err: any) {
    console.error("DB Check Failed:", err.message);
    process.exit(1);
  }
}

check();
