import { query } from './db';

async function checkDefaults() {
  try {
    const res = await query(`
      SELECT column_name, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'dim_users'
    `);
    console.table(res.rows);
  } catch (err) {
    console.error("❌ Error checking defaults:", err);
  }
}

checkDefaults();
