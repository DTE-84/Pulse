import pg from 'pg';
import "dotenv/config";

const { Pool } = pg;

let pool: any;

function getPool() {
  if (!pool) {
    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
      console.error("[PULSE DB] FATAL: DATABASE_URL is missing from environment variables.");
      // Throwing an error here prevents Pool from trying to connect to a default 127.0.0.1
      throw new Error("Database configuration error: Missing DATABASE_URL.");
    }
    
    const isProd = process.env.NODE_ENV === "production";
    console.log(`[PULSE DB] Initializing pool (Production: ${isProd})`);
    
    pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }, // Relaxed for stable cloud pooler handshake
    });

    pool.on('error', (err: any) => {
      console.error("[PULSE DB] Unexpected error on idle client:", err.message);
    });
  }
  return pool;
}

export const query = (text: string, params?: any[]) => getPool().query(text, params);

export default getPool;
