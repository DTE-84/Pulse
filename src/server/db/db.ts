import { Pool } from "pg";

let pool: Pool | undefined;

function getPool() {
  if (!pool) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.warn("[PULSE DB] WARNING: DATABASE_URL is missing from environment variables.");
      // We don't throw here to allow diagnostic routes to function
      return {
        query: () => { throw new Error("Database offline: DATABASE_URL missing."); },
        on: () => {}
      } as any;
    }

    const isProd = process.env.NODE_ENV === "production";
    console.log(`[PULSE DB] Initializing pool (Production: ${isProd})`);

    pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
    });

    pool.on("error", (err: any) => {
      console.error("[PULSE DB] Unexpected error on idle client:", err.message);
    });
  }

  return pool;
}

export const query = (text: string, params?: any[]) => {
  const p = getPool();
  if (!p) throw new Error("Database pool not initialized.");
  return p.query(text, params);
};

export default getPool;
