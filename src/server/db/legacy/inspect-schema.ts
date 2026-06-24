import getPool, { query } from './db.js';

async function checkSchema() {
  try {
    const tables = ['dim_users', 'fact_transactions', 'dim_goals'];
    for (const table of tables) {
      console.log(`\n--- Schema for ${table} ---`);
      const res = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [table]);
      console.table(res.rows);
    }
  } catch (err) {
    console.error("❌ Error checking schema:", err);
  } finally {
    await getPool().end();
  }
}

checkSchema();
