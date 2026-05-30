import pg from 'pg';
const { Client } = pg;

async function checkTriggers() {
  const client = new Client({
    connectionString: "postgresql://postgres.uxgjcgfdfnmiixlkisjd:DtE4487774022!@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query("SELECT trigger_name FROM dim_triggers;");
    console.log("Triggers in dim_triggers:");
    res.rows.forEach(row => console.log(`- ${row.trigger_name}`));
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

checkTriggers();
