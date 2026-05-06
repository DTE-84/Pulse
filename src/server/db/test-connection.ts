import pg from 'pg';
import "dotenv/config";

const { Pool } = pg;

async function testConnection() {
  console.log("Attempting to connect to Pulse DB at Supabase...");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Common for Supabase
  });

  try {
    const res = await pool.query('SELECT NOW()');
    console.log("✅ SUCCESS: Pulse DB Uplink established at " + res.rows[0].now);
    
    // Check if the Star Schema is present
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('dim_users', 'fact_transactions', 'dim_triggers')
    `);
    
    if ((tableCheck.rowCount ?? 0) > 0) {
      console.log("✅ SUCCESS: Star Schema detected: " + tableCheck.rows.map(r => r.table_name).join(', '));
    } else {
      console.log("⚠️ WARNING: Connection successful, but Star Schema tables not found. You might need to run the SQL in the Supabase editor.");
    }

  } catch (err: any) {
    console.error("❌ ERROR: Connection failed.", err.message);
  } finally {
    await pool.end();
  }
}

testConnection();
