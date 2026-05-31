import fs from 'fs';
import path from 'path';
import { query } from './db';

async function syncUsers() {
  try {
    console.log("Reading SYNC_USERS.sql...");
    const sqlPath = path.join(process.cwd(), 'sql', 'SYNC_USERS.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log("Applying user synchronization and trigger to Supabase...");
    await query(sql);
    console.log("✅ Users synchronized and automation trigger established.");
  } catch (err) {
    console.error("❌ Failed to sync users:", err);
  }
}

syncUsers();
