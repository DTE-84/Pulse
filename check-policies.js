import pg from 'pg';
const { Client } = pg;

async function checkPolicies() {
  const client = new Client({
    connectionString: "postgresql://postgres.uxgjcgfdfnmiixlkisjd:DtE4487774022!@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT 
        conname, 
        pg_get_constraintdef(c.oid) 
      FROM pg_constraint c 
      JOIN pg_namespace n ON n.oid = c.connamespace 
      WHERE conrelid = 'public.dim_users'::regclass;
    `);
    console.log("dim_users constraints:");
    res.rows.forEach(row => console.log(`- ${row.conname}: ${row.pg_get_constraintdef}`));

    const policies = await client.query(`
      SELECT * FROM pg_policies WHERE tablename = 'dim_users';
    `);
    console.log("dim_users policies:");
    policies.rows.forEach(row => console.log(row));

    const rls = await client.query(`
      SELECT relname, relrowsecurity FROM pg_class WHERE oid = 'public.dim_users'::regclass;
    `);
    console.log("dim_users RLS enabled:", rls.rows[0].relrowsecurity);

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

checkPolicies();
