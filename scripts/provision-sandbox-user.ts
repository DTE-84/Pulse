// scripts/provision-sandbox-user.ts
// One-time setup: creates the sandbox user in Supabase Auth + dim_users,
// marks onboarding complete, and seeds 30 days of synthetic transactions.
//
// Run:  npx tsx scripts/provision-sandbox-user.ts

import { createClient } from '@supabase/supabase-js';
import { generateHistoricalSeed } from '../src/lib/syntheticTransactions.js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const SANDBOX_UUID = process.env.SANDBOX_USER_ID || 'ddeaa710-caf5-4b3f-949c-5e1e27b0959b';
const SANDBOX_EMAIL = 'sandbox@pulse.demo';
const SANDBOX_PASSWORD = 'SandboxPulse2026!Demo';
const SANDBOX_NAME = 'Sandbox User';

// ─── Category Cache ──────────────────────────────────────────────────────────
const categoryCache = new Map<string, number>();

async function getOrCreateCategoryId(categoryName: string): Promise<number> {
  if (categoryCache.has(categoryName)) return categoryCache.get(categoryName)!;

  const { data } = await supabase
    .from('dim_categories')
    .select('category_id')
    .eq('category_name', categoryName)
    .maybeSingle();

  if (data?.category_id) {
    categoryCache.set(categoryName, data.category_id);
    return data.category_id;
  }

  const { data: newCat } = await supabase
    .from('dim_categories')
    .insert({ category_name: categoryName, risk_level: 'Medium' })
    .select('category_id')
    .single();

  if (newCat?.category_id) {
    categoryCache.set(categoryName, newCat.category_id);
    return newCat.category_id;
  }

  return 1;
}

async function provision() {
  console.log(`\n🔧 Provisioning Sandbox User: ${SANDBOX_UUID}\n`);

  // ── Step 1: Create in Supabase Auth ────────────────────────────────────────
  console.log('1️⃣  Creating Supabase Auth identity...');
  
  // Check if already exists
  const { data: existingAuth } = await supabase.auth.admin.getUserById(SANDBOX_UUID);
  
  if (existingAuth?.user) {
    console.log(`   ✅ Already exists in auth.users: ${existingAuth.user.email}`);
  } else {
    // Create with specific UUID
    const { data: newAuth, error: authErr } = await supabase.auth.admin.createUser({
      id: SANDBOX_UUID,
      email: SANDBOX_EMAIL,
      password: SANDBOX_PASSWORD,
      email_confirm: true,
      user_metadata: { name: SANDBOX_NAME },
    });

    if (authErr) {
      console.error('   ❌ Auth creation failed:', authErr.message);
      process.exit(1);
    }
    console.log(`   ✅ Created auth user: ${newAuth.user.email} (${newAuth.user.id})`);
  }

  // ── Step 2: Ensure dim_users record with onboarding_completed = true ──────
  console.log('2️⃣  Ensuring dim_users profile...');
  
  const { error: upsertErr } = await supabase.from('dim_users').upsert([{
    user_id: SANDBOX_UUID,
    user_name: SANDBOX_NAME,
    email: SANDBOX_EMAIL,
    is_demo: true,
    onboarding_completed: true,
    subscription_status: 'trialing',
    subscription_tier: 'trial',
    baseline_spend: 2500.00,
    monthly_income: 5200.00,
    initial_balance: 15000.00,
    nova_tone: 'Balanced',
    plaid_env: 'sandbox',
  }], { onConflict: 'user_id' });

  if (upsertErr) {
    console.error('   ❌ dim_users upsert failed:', upsertErr.message);
    process.exit(1);
  }
  console.log('   ✅ dim_users profile ready (onboarding_completed: true)');

  // ── Step 3: Seed 30 days of synthetic transactions ─────────────────────────
  console.log('3️⃣  Seeding 30 days of synthetic transactions...');

  // Check if there are already transactions
  const { data: existingTx } = await supabase
    .from('fact_transactions')
    .select('transaction_id')
    .eq('user_id', SANDBOX_UUID)
    .eq('is_synthetic', true)
    .limit(1);

  if (existingTx && existingTx.length > 0) {
    console.log('   ⚠️  Synthetic transactions already exist. Skipping seed to avoid duplicates.');
    console.log('   (Delete existing rows first if you want to re-seed.)');
  } else {
    const accountId = `sandbox_auto_${SANDBOX_UUID.slice(0, 8)}`;
    const rawTxs = generateHistoricalSeed(SANDBOX_UUID, accountId, 30);
    console.log(`   Generated ${rawTxs.length} synthetic transactions.`);

    const rows = [];
    for (const tx of rawTxs) {
      const catName = tx.category?.[0] || tx.personal_finance_category || 'Misc';
      const categoryId = await getOrCreateCategoryId(catName);
      rows.push({
        user_id: tx.user_id,
        category_id: categoryId,
        amount: tx.amount,
        purchase_date: tx.datetime,
        merchant_name: tx.merchant_name,
        external_id: tx.plaid_transaction_id,
        status: tx.pending ? 'Pending' : 'Completed',
        is_synthetic: true,
      });
    }

    // Insert in batches
    const batchSize = 50;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error: insertErr } = await supabase
        .from('fact_transactions')
        .upsert(batch, { onConflict: 'external_id', ignoreDuplicates: true });

      if (insertErr) {
        console.error(`   ❌ Batch insert failed:`, insertErr.message);
      } else {
        inserted += batch.length;
      }
    }
    console.log(`   ✅ Inserted ${inserted} synthetic transactions.`);
  }

  // ── Verify ──────────────────────────────────────────────────────────────────
  console.log('\n📊 Verification:');
  const { data: finalUser } = await supabase.from('dim_users').select('user_id, email, onboarding_completed').eq('user_id', SANDBOX_UUID).maybeSingle();
  console.log('   dim_users:', finalUser);

  const { data: finalTx } = await supabase.from('fact_transactions').select('transaction_id').eq('user_id', SANDBOX_UUID);
  console.log('   Transaction count:', finalTx?.length ?? 0);

  const { data: finalAuth } = await supabase.auth.admin.getUserById(SANDBOX_UUID);
  console.log('   auth.users:', finalAuth?.user?.email ?? 'NOT FOUND');

  console.log('\n✨ Sandbox user fully provisioned. Guest login should now work.\n');
  process.exit(0);
}

provision().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
