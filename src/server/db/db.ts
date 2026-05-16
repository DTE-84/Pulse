import pg from 'pg';
import "dotenv/config";

const { Pool } = pg;

let pool: any;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      console.warn("[PULSE DB] DATABASE_URL is missing.");
    }
    
    const isProd = process.env.NODE_ENV === "production";
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { 
        rejectUnauthorized: isProd // Strictly verify in production
      },
    });
  }
  return pool;
}

export const query = (text: string, params?: any[]) => getPool().query(text, params);

export default getPool;
