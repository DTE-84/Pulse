import { query } from './db';

async function checkSchema() {
  try {
    const tables = ['dim_users', 'fact_transactions', 'dim_categories', 'dim_triggers', 'dim_goals'];
    for (const table of tables) {
      const res = await query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${table}'`);
      console.log(`Columns in ${table}:`, res.rows);
    }
  } catch (err) {
    console.error("Error checking schema:", err);
  }
}

checkSchema();
