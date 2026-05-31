import fs from 'fs';
import path from 'path';
import { query } from './db';

async function applyFix() {
  try {
    console.log("Reading SUPABASE_FIX.sql...");
    const sqlPath = path.join(process.cwd(), 'sql', 'SUPABASE_FIX.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log("Applying migration to Supabase...");
    await query(sql);
    console.log("✅ Migration applied successfully. UUID schema is now active.");
  } catch (err) {
    console.error("❌ Failed to apply migration:", err);
  }
}

applyFix();
