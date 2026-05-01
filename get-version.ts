import pg from 'pg';
import "dotenv/config";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function getVersion() {
  try {
    const res = await pool.query('SHOW server_version;');
    console.log('Server Version:', res.rows[0].server_version);
    process.exit(0);
  } catch (err) {
    console.error('Failed to get version:', err);
    process.exit(1);
  }
}

getVersion();
