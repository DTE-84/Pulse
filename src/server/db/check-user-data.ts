import pg from 'pg';
import "dotenv/config";

const { Pool } = pg;

async function checkUserData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const userId = 'fe67369a-fd48-4634-bc04-42da3a8ced63';
    console.log(`Checking for user_id: ${userId}`);
    
    const res = await pool.query("SELECT * FROM dim_users WHERE user_id = $1", [userId]);
    if (res.rows.length > 0) {
      console.log("✅ User found in dim_users:");
      console.table(res.rows);
    } else {
      console.log("❌ User NOT found in dim_users.");
      
      // Check if user exists in auth.users
      const authRes = await pool.query("SELECT id, email FROM auth.users WHERE id = $1", [userId]);
      if (authRes.rows.length > 0) {
        console.log("✅ User found in auth.users, but missing in public.dim_users.");
      } else {
        console.log("❌ User NOT found in auth.users either.");
      }
    }
  } catch (err) {
    console.error("❌ Error checking user data:", err);
  } finally {
    await pool.end();
  }
}

checkUserData();
