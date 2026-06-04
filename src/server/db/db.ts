import pkg from 'pg';
const { Pool } = pkg;

let _pool: pkg.Pool | null = null;

function getPool(): pkg.Pool {
  if (!_pool) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.warn("[PULSE DB] WARNING: DATABASE_URL is missing.");
      throw new Error("Database configuration missing: DATABASE_URL not found.");
    }

    const isProd = process.env.NODE_ENV === "production";
    console.log(`[PULSE DB] Initializing uplink (Production: ${isProd})`);

    _pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    _pool.on("error", (err: Error) => {
      console.error("[PULSE DB] Unexpected connectivity disruption:", err.message);
    });
  }

  return _pool;
}

export const query = async (text: string, params?: any[]) => {
  const pool = getPool();
  return pool.query(text, params);
};

export default { getPool, query };
