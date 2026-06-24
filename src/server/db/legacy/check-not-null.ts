import { query } from './db.js';

async function checkNotNull() {
  try {
    console.log("\n--- NOT NULL Constraints for dim_users ---");
    const res = await query(`
      SELECT column_name, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'dim_users' 
      AND is_nullable = 'NO';
    `);
    console.table(res.rows);
  } catch (err) {
    console.error("❌ Error checking constraints:", err);
  }
}

checkNotNull();
