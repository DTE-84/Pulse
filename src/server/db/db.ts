import pkg from 'pg';

let _pool: any = null;

/**
 * High-Fidelity Database Uplink
 * Engineered as a resilient singleton to prevent initialization race conditions.
 */
function getPool() {
  if (!_pool) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.warn("[PULSE DB] FATAL: DATABASE_URL is missing.");
      throw new Error("Critical Failure: DATABASE_URL environment variable is not defined.");
    }

    const isProd = process.env.NODE_ENV === "production";
    console.log(`[PULSE DB] Initializing Deterministic Uplink (Production: ${isProd})`);

    // Use default import pattern to bypass ESM/CJS bundling conflicts
    _pool = new pkg.Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      max: 15,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    _pool.on("error", (err: Error) => {
      console.error("[PULSE DB] Critical Connectivity Disruption:", err.message);
    });
  }

  return _pool;
}

export const query = async (text: string, params?: any[]) => {
  const pool = getPool();
  return pool.query(text, params);
};

export default { getPool, query };
