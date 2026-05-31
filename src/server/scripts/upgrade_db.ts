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

async function upgrade() {
  try {
    console.log("🚀 Upgrading Pulse Database to High-Fidelity Schema...");
    
    // Add monthly_income and initial_balance if they don't exist
    await getPool().query(`
      ALTER TABLE dim_users 
      ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(10, 2) DEFAULT 5200.00,
      ADD COLUMN IF NOT EXISTS initial_balance DECIMAL(10, 2) DEFAULT 15000.00;
    `);
    
    console.log("✅ Schema synchronized.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Upgrade failed:", err);
    process.exit(1);
  }
}

upgrade();
