import pg from 'pg';
const { Client } = pg;

async function testInsert() {
  const client = new Client({
    connectionString: "postgresql://postgres.uxgjcgfdfnmiixlkisjd:DtE4487774022!@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("[TEST] Attempting surgical insertion into dim_users...");
    
    const guestId = Math.random().toString(36).substring(7);
    const email = `test_guest_${guestId}@pulse.demo`;
    const name = `Test Guest ${guestId.toUpperCase()}`;
    const password = "test_password_123";

    const res = await client.query(
      "INSERT INTO dim_users (user_name, email, password, is_demo, subscription_status) VALUES ($1, $2, $3, $4, $5) RETURNING user_id",
      [name, email, password, true, 'trialing']
    );
    
    console.log("[TEST] SUCCESS! Created User ID:", res.rows[0].user_id);
    
    // Cleanup
    await client.query("DELETE FROM dim_users WHERE user_id = $1", [res.rows[0].user_id]);
    console.log("[TEST] Cleanup successful.");

  } catch (err) {
    console.error("[TEST] FATAL ERROR:", err.message);
    if (err.detail) console.error("[TEST] DETAIL:", err.detail);
    if (err.hint) console.error("[TEST] HINT:", err.hint);
    if (err.where) console.error("[TEST] WHERE:", err.where);
  } finally {
    await client.end();
  }
}

testInsert();
