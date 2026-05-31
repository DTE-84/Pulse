import { query } from './db';

async function addIntentions() {
  try {
    console.log("Adding intentions column to dim_users...");
    await query(`
      ALTER TABLE public.dim_users 
      ADD COLUMN IF NOT EXISTS intentions JSONB DEFAULT '[]'::jsonb;
    `);
    console.log("✅ Column added.");
  } catch (err) {
    console.error("❌ Error adding column:", err);
  }
}

addIntentions();
