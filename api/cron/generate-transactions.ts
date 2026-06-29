// api/cron/generate-transactions.ts
// Vercel cron job — runs on schedule and inserts synthetic transactions
// into Supabase so Pulse always has fresh data for Nova to analyze.
//
// User Resolution Strategy:
//   1. Query dim_users for all onboarded users (onboarding_completed = true)
//   2. Use plaid_items to find a plaid_account_id per user if available
//   3. Fall back to 'sandbox_auto' as a placeholder account ID
//   SANDBOX_TEST_USER_ID is no longer required — the cron is fully self-contained.

import { createClient } from '@supabase/supabase-js';
import { Request, Response } from 'express';
import { generateTransactions } from '../lib/syntheticTransactions.js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl || '', serviceRoleKey || '');
const TABLE_NAME = 'fact_transactions';

function getTxCount(): number {
  const hour = new Date().getHours();
  if (hour >= 17 && hour <= 21) return Math.floor(Math.random() * 3) + 3;
  return Math.floor(Math.random() * 2) + 2;
}

const categoryCache = new Map<string, number>();

async function getOrCreateCategoryId(categoryName: string): Promise<number> {
  if (categoryCache.has(categoryName)) {
    return categoryCache.get(categoryName)!;
  }

  try {
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
  } catch (err) {
    console.error(`[Cron] Category resolution failed:`, err);
  }

  return 1;
}

/**
 * Resolves the list of users to generate synthetic transactions for.
 * Queries dim_users for all onboarded users and pairs each with their
 * Plaid account ID (if any), removing the dependency on SANDBOX_TEST_USER_ID.
 */
async function resolveTargetUsers(): Promise<{ user_id: string; plaid_account_id: string }[]> {
  // 1. Fetch all users who have completed onboarding
  const { data: dbUsers, error: userError } = await supabase
    .from('dim_users')
    .select('user_id')
    .eq('onboarding_completed', true);

  if (userError) {
    console.error('[Cron] Failed to fetch users from dim_users:', userError);
    return [];
  }

  if (!dbUsers || dbUsers.length === 0) {
    console.warn('[Cron] No onboarded users found in dim_users.');
    return [];
  }

  const userIds = dbUsers.map(u => u.user_id);

  // 2. Fetch plaid_items to get account IDs (one per user, latest wins)
  const { data: plaidItems } = await supabase
    .from('plaid_items')
    .select('user_id, plaid_item_id')
    .in('user_id', userIds);

  const plaidMap = new Map<string, string>();
  if (plaidItems) {
    for (const item of plaidItems) {
      plaidMap.set(item.user_id, item.plaid_item_id);
    }
  }

  // 3. Build final user list — every onboarded user gets a transaction batch,
  //    with their real Plaid account ID or a stable fallback.
  return userIds.map(userId => ({
    user_id: userId,
    plaid_account_id: plaidMap.get(userId) ?? `sandbox_auto_${userId.slice(0, 8)}`,
  }));
}

export default async function handler(req: Request, res: Response) {
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[Cron] Unauthorized attempt to hit cron endpoint');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const users = await resolveTargetUsers();

    // Delete synthetic transactions older than 7 days to keep data realistic
    const { error: deleteError } = await supabase
      .from('fact_transactions')
      .delete()
      .eq('is_synthetic', true)
      .lt('purchase_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (deleteError) {
      console.error('[Cron] Failed to delete old synthetic transactions:', deleteError);
    } else {
      console.log('[Cron] Cleaned up old synthetic transactions.');
    }

    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        generated: 0,
        users: 0,
        message: 'No onboarded users to generate transactions for.',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`[Cron] Generating transactions for ${users.length} user(s).`);

    let totalInserted = 0;
    const errors: string[] = [];

    for (const user of users) {
      const count = getTxCount();
      const transactions = generateTransactions(
        user.user_id,
        user.plaid_account_id,
        count
      );

      const rows = await Promise.all(transactions.map(async tx => ({
        user_id: tx.user_id,
        amount: tx.amount,
        purchase_date: tx.datetime,
        merchant_name: tx.merchant_name,
        external_id: tx.plaid_transaction_id,
        status: tx.pending ? 'pending' : 'posted',
        is_synthetic: true,
        category_id: await getOrCreateCategoryId(tx.personal_finance_category),
      })));

      const { error: insertError } = await supabase
        .from(TABLE_NAME)
        .insert(rows)
        .select();

      if (insertError) {
        console.error(`[Cron] Insert failed for user ${user.user_id}:`, insertError);
        errors.push(`${user.user_id}: ${insertError.message}`);
      } else {
        totalInserted += count;
        console.log(`[Cron] ✅ Inserted ${count} transactions for user ${user.user_id}`);
      }
    }

    const response = {
      success: true,
      generated: totalInserted,
      users: users.length,
      timestamp: new Date().toISOString(),
      errors: errors.length > 0 ? errors : undefined,
    };

    return res.status(200).json(response);

  } catch (err: any) {
    return res.status(500).json({ error: 'Cron job failed', detail: err.message });
  }
}
