import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function getUserId() {
  try {
    const res = await pool.query('SELECT user_id FROM dim_users LIMIT 1');
    console.log(res.rows[0].user_id);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

getUserId();
