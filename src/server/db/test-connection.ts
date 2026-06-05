import { query, getPool } from "./db.js";

async function testConnection() {
  console.log("Attempting to connect to Pulse DB at Supabase...");

  try {
    const res = await query('SELECT NOW()');
    console.log("✅ SUCCESS: Pulse DB Uplink established at " + res.rows[0].now);
    
    // Check if the Star Schema is present
    const tableCheck = await query(`
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
    await getPool().end();
  }
}

testConnection();
