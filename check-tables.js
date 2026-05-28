import pg from 'pg';
const { Client } = pg;

async function checkTables() {
  const client = new Client({
    connectionString: "postgresql://postgres.uxgjcgfdfnmiixlkisjd:DtE4487774022!@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';");
    console.log("Tables in public schema:");
    res.rows.forEach(row => console.log(`- ${row.tablename}`));
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

checkTables();
