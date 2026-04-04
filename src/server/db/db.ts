import pg from 'pg';
import "dotenv/config";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;
