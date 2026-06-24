import getPool, { query } from './db.js';

async function checkPolicies() {
  try {
    console.log("\n--- RLS Policies for dim_users ---");
    const res = await query(`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'dim_users';
    `);
    console.table(res.rows);
  } catch (err) {
    console.error("❌ Error checking policies:", err);
  } finally {
    await getPool().end();
  }
}

checkPolicies();
