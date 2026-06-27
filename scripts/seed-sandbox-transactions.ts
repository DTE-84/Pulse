// scripts/seed-sandbox-transactions.ts
// Run this ONCE to backfill 30 days of synthetic history so Nova has
// meaningful data to analyze from the moment someone logs in.
//
// Usage:
//   npx tsx scripts/seed-sandbox-transactions.ts

import { createClient } from '@supabase/supabase-js';
import { generateHistoricalSeed } from '../src/lib/syntheticTransactions.js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const TABLE_NAME = 'fact_transactions';

// ─── Category Cache ──────────────────────────────────────────────────────────
const categoryCache = new Map<string, number>();

async function getOrCreateCategoryId(categoryName: string): Promise<number> {
  if (categoryCache.has(categoryName)) {
    return categoryCache.get(categoryName)!;
  }

  try {
    const { data, error } = await supabase
      .from('dim_categories')
      .select('category_id')
      .eq('category_name', categoryName)
      .maybeSingle();

    if (data?.category_id) {
      categoryCache.set(categoryName, data.category_id);
      return data.category_id;
    }

    const { data: newCat, error: insertError } = await supabase
      .from('dim_categories')
      .insert({ category_name: categoryName, risk_level: 'Medium' })
      .select('category_id')
      .single();

    if (newCat?.category_id) {
      categoryCache.set(categoryName, newCat.category_id);
      return newCat.category_id;
    }
  } catch (err) {
    console.error(`[Seed] Category resolution failed for ${categoryName}:`, err);
  }

  // Fallback
  try {
    const { data: fallbackCat } = await supabase
      .from('dim_categories')
      .select('category_id')
      .limit(1)
      .single();
    if (fallbackCat?.category_id) {
      return fallbackCat.category_id;
    }
  } catch (fallbackErr) {
    // Ignore
  }

  return 1;
}

async function seedSandboxTransactions() {
  console.log('🌱 Starting sandbox transaction seed...\n');

  // ── Get all sandbox users ─────────────────────────────────────────────────
  const { data: sandboxUsers, error } = await supabase
    .from('plaid_items')
    .select('user_id, plaid_item_id')
    .eq('environment', 'sandbox');

  if (error) {
    console.error('❌ Failed to fetch sandbox users:', error);
    process.exit(1);
  }

  const users = [];
  if (sandboxUsers && sandboxUsers.length > 0) {
    for (const item of sandboxUsers) {
      users.push({
        user_id: item.user_id,
        plaid_account_id: item.plaid_item_id,
      });
    }
  } else {
    // Fallback to env vars if no DB records yet
    const testUserId = process.env.SANDBOX_TEST_USER_ID;
    const testAccountId = process.env.SANDBOX_TEST_ACCOUNT_ID || 'sandbox_test_account';
    
    if (testUserId) {
      users.push({
        user_id: testUserId,
        plaid_account_id: testAccountId,
      });
    }
  }

  if (users.length === 0) {
    console.error('❌ No sandbox users found in plaid_items and SANDBOX_TEST_USER_ID not set in .env');
    process.exit(1);
  }

  for (const user of users) {
    console.log(`📊 Generating 30-day history for user ${user.user_id}...`);

    const rawTransactions = generateHistoricalSeed(user.user_id, user.plaid_account_id, 30);
    console.log(`  Generated ${rawTransactions.length} synthetic transactions.`);

    // Map fields to DB schema
    const transactions = [];
    for (const tx of rawTransactions) {
      const catName = tx.category?.[0] || 'Misc';
      const categoryId = await getOrCreateCategoryId(catName);

      transactions.push({
        user_id: tx.user_id,
        category_id: categoryId,
        amount: tx.amount,
        purchase_date: tx.datetime,
        merchant_name: tx.merchant_name,
        external_id: tx.plaid_transaction_id,
        status: tx.pending ? 'Pending' : 'Completed',
        is_synthetic: tx.is_synthetic,
      });
    }

    // Insert in batches of 50 to avoid Supabase payload limits
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);

      // Use upsert with ignoreDuplicates to bypass duplicates gracefully
      const { error: insertError } = await supabase
        .from(TABLE_NAME)
        .upsert(batch, { onConflict: 'external_id', ignoreDuplicates: true })
        .select();

      if (insertError) {
        console.error(`  ❌ Batch insert failed:`, insertError);
      } else {
        inserted += batch.length;
        process.stdout.write(`  ✅ Processed batch ${Math.ceil((i + batchSize) / batchSize)} / ${Math.ceil(transactions.length / batchSize)}\r`);
      }
    }

    console.log(`\n  📈 Total processed: ${inserted} transactions for user ${user.user_id}`);
  }

  console.log('\n✨ Seed complete. Nova has data to work with.\n');
  process.exit(0);
}

seedSandboxTransactions().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
