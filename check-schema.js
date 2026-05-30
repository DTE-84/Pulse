import pg from 'pg';
const { Client } = pg;

async function checkSchema() {
  const client = new Client({
    connectionString: "postgresql://postgres.uxgjcgfdfnmiixlkisjd:DtE4487774022!@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT 
        column_name, 
        is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'dim_users' AND column_name = 'user_id_int';
    `);
    console.log("dim_users.user_id_int details:");
    console.log(res.rows[0]);

    const constraints = await client.query(`
      SELECT 
        conname, 
        pg_get_constraintdef(c.oid) 
      FROM pg_constraint c 
      JOIN pg_namespace n ON n.oid = c.connamespace 
      WHERE conrelid = 'public.dim_users'::regclass;
    `);
    console.log("dim_users constraints:");
    constraints.rows.forEach(row => console.log(`- ${row.conname}: ${row.pg_get_constraintdef}`));
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

checkSchema();
