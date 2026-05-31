import fs from 'fs';
import path from 'path';
import { query } from './db';

async function cleanPolicies() {
  try {
    console.log("Reading CLEAN_POLICIES.sql...");
    const sqlPath = path.join(process.cwd(), 'sql', 'CLEAN_POLICIES.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log("Consolidating RLS policies in Supabase...");
    await query(sql);
    console.log("✅ RLS policies cleaned and consolidated.");
  } catch (err) {
    console.error("❌ Failed to clean policies:", err);
  }
}

cleanPolicies();
