import pg from 'pg';
const { Client } = pg;

async function checkColumns() {
  const client = new Client({
    connectionString: "postgresql://postgres.uxgjcgfdfnmiixlkisjd:DtE4487774022!@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'transactions';");
    console.log("Columns in transactions:");
    res.rows.forEach(row => console.log(`- ${row.column_name} (${row.data_type})`));
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

checkColumns();
