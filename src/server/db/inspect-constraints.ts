import getPool, { query } from './db.js';

async function checkConstraints() {
  try {
    console.log("\n--- Primary Key Constraints ---");
    const pkRes = await query(`
      SELECT conname, contype, a.attname
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE c.contype = 'p' AND c.conrelid IN ('dim_users'::regclass, 'fact_transactions'::regclass);
    `);
    console.table(pkRes.rows);

    console.log("\n--- Foreign Key Constraints ---");
    const fkRes = await query(`
      SELECT conname, confrelid::regclass as ref_table, a.attname as col
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE c.contype = 'f' AND c.conrelid IN ('fact_transactions'::regclass, 'dim_goals'::regclass);
    `);
    console.table(fkRes.rows);

    console.log("\n--- RLS Status ---");
    const rlsRes = await query(`
      SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('dim_users', 'fact_transactions', 'dim_goals');
    `);
    console.table(rlsRes.rows);
  } catch (err) {
    console.error("❌ Error checking constraints:", err);
  } finally {
    await getPool().end();
  }
}

checkConstraints();
