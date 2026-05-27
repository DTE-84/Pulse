
const pg = require('pg');
require('dotenv').config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const bankRes = await pool.query("SELECT * FROM public.bank_accounts LIMIT 5");
    console.log("bank_accounts rows:", bankRes.rows);

    const columns = await pool.query("SELECT table_name, column_name FROM information_schema.columns WHERE table_name IN ('bank_accounts', 'merchants', 'transactions', 'profiles', 'dim_users')");
    console.log("Columns:", columns.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
