import "dotenv/config";
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function upgrade() {
  try {
    console.log("🚀 Upgrading Pulse Database to High-Fidelity Schema...");
    
    // Add monthly_income and initial_balance if they don't exist
    await pool.query(`
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
