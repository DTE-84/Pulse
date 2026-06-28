// scripts/remap-synthetic-user.ts
// One-time fix: remaps synthetic transactions from a stale SANDBOX_TEST_USER_ID
// to your actual authenticated user UUID (the first onboarded user in dim_users).
//
// Run:  npx tsx scripts/remap-synthetic-user.ts

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function remapSyntheticUser() {
  console.log('🔍 Scanning for stale synthetic transactions...\n');

  // ── 1. Find all distinct user_ids that own synthetic transactions ─────────
  const { data: syntheticUserIds, error: fetchError } = await supabase
    .from('fact_transactions')
    .select('user_id')
    .eq('is_synthetic', true);

  if (fetchError) {
    console.error('❌ Failed to fetch synthetic transactions:', fetchError);
    process.exit(1);
  }

  const uniqueSyntheticUserIds = [...new Set((syntheticUserIds ?? []).map(r => r.user_id))];
  console.log(`Found synthetic transactions under ${uniqueSyntheticUserIds.length} user ID(s):`);
  uniqueSyntheticUserIds.forEach(id => console.log(`  - ${id}`));

  // ── 2. Find all real onboarded users in dim_users ─────────────────────────
  const { data: realUsers, error: userError } = await supabase
    .from('dim_users')
    .select('user_id, email')
    .eq('onboarding_completed', true);

  if (userError) {
    console.error('❌ Failed to fetch real users:', userError);
    process.exit(1);
  }

  if (!realUsers || realUsers.length === 0) {
    console.error('❌ No onboarded users found in dim_users. Cannot remap.');
    process.exit(1);
  }

  const realUserIds = new Set(realUsers.map(u => u.user_id));
  console.log(`\nReal onboarded users in dim_users:`);
  realUsers.forEach(u => console.log(`  - ${u.user_id}  (${u.email})`));

  // ── 3. Identify stale UUIDs (synthetic rows not belonging to any real user) ─
  const staleIds = uniqueSyntheticUserIds.filter(id => !realUserIds.has(id));

  if (staleIds.length === 0) {
    console.log('\n✅ No stale synthetic transactions found. All synthetic data belongs to real users.');
    process.exit(0);
  }

  console.log(`\n⚠️  Stale synthetic user IDs (not in dim_users):`);
  staleIds.forEach(id => console.log(`  - ${id}`));

  // ── 4. Determine the target real user ────────────────────────────────────
  // Use the first onboarded user, or the one specified by SANDBOX_TEST_USER_ID
  // as the fallback target (if it now points to a real UUID).
  let targetUserId = realUsers[0].user_id;
  const envFallback = process.env.SANDBOX_TEST_USER_ID;
  if (envFallback && realUserIds.has(envFallback)) {
    targetUserId = envFallback;
    console.log(`\n🎯 Remapping to SANDBOX_TEST_USER_ID (real user): ${targetUserId}`);
  } else {
    console.log(`\n🎯 Remapping to first onboarded user: ${targetUserId} (${realUsers[0].email})`);
  }

  // ── 5. Remap each stale UUID ───────────────────────────────────────────────
  let totalRemapped = 0;

  for (const staleId of staleIds) {
    const { data: countData } = await supabase
      .from('fact_transactions')
      .select('transaction_id')
      .eq('user_id', staleId)
      .eq('is_synthetic', true);

    const count = countData?.length ?? 0;
    console.log(`\n  Remapping ${count} synthetic rows from ${staleId} → ${targetUserId}...`);

    const { error: updateError } = await supabase
      .from('fact_transactions')
      .update({ user_id: targetUserId })
      .eq('user_id', staleId)
      .eq('is_synthetic', true);

    if (updateError) {
      console.error(`  ❌ Remap failed for ${staleId}:`, updateError.message);
    } else {
      totalRemapped += count;
      console.log(`  ✅ Remapped ${count} transactions.`);
    }
  }

  console.log(`\n🏁 Done. Total remapped: ${totalRemapped} synthetic transactions.`);
  console.log(`   They now belong to: ${targetUserId}\n`);
  process.exit(0);
}

remapSyntheticUser().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
