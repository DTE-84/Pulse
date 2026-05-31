import "dotenv/config";
import { Pool } from "pg";

let pool: Pool | undefined;

function getPool() {
  if (!pool) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error("[PULSE DB] FATAL: DATABASE_URL is missing from environment variables.");
      throw new Error("Database configuration error: Missing DATABASE_URL.");
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

async function check() {
  try {
    const res = await getPool().query("SELECT column_name FROM information_schema.columns WHERE table_name = 'dim_users'");
    console.log("Columns in dim_users:", res.rows.map(r => r.column_name).join(", "));
    process.exit(0);
  } catch (err: any) {
    console.error("DB Check Failed:", err.message);
    process.exit(1);
  }
}

check();
