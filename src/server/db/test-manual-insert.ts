import { query } from "./db.js";
import crypto from "crypto";

async function testManualInsert() {
  const testId = crypto.randomUUID();
  const testEmail = `manual_test_${Math.random().toString(36).substring(7)}@test.com`;
  const testName = "Manual Test User";
  
  console.log(`[TEST] Attempting manual insert for ID: ${testId}, Email: ${testEmail}`);
  
  try {
    const res = await query(`
      INSERT INTO public.dim_users (
        user_id,
        email,
        user_name,
        onboarding_completed,
        baseline_spend,
        subscription_status,
        trial_ends_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      testId,
      testEmail,
      testName,
      false,
      2500.00,
      'trialing',
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    ]);
    
    console.log("[TEST] Success! Inserted:", res.rows[0].user_id);
    
    // Cleanup
    await query("DELETE FROM public.dim_users WHERE user_id = $1", [testId]);
    console.log("[TEST] Cleaned up.");
    
  } catch (err) {
    console.error("[TEST] Error:", err.message);
    if (err.detail) console.error("[TEST] Detail:", err.detail);
    if (err.hint) console.error("[TEST] Hint:", err.hint);
  } finally {
    process.exit(0);
  }
}

testManualInsert();
