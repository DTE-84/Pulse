// api/cron/generate-transactions.ts
// Vercel cron job — runs on schedule and inserts synthetic transactions
// into Supabase so Pulse always has fresh data for Nova to analyze.

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
    const users = [{
      user_id: process.env.SANDBOX_TEST_USER_ID!,
      plaid_account_id: process.env.SANDBOX_TEST_ACCOUNT_ID!,
    }];

    let totalInserted = 0;
    const errors: string[] = [];

    for (const user of users) {
      const count = getTxCount();
      const transactions = generateTransactions(
        user.user_id,
        user.plaid_account_id,
        count
      );

      const rows = transactions.map(tx => ({
        // transaction_id is SERIAL — don't include, Postgres auto-generates it
        user_id: tx.user_id,
        amount: tx.amount,
        purchase_date: tx.datetime,
        merchant_name: tx.merchant_name,
        external_id: tx.plaid_transaction_id,
        status: tx.pending ? 'pending' : 'posted',
        is_synthetic: true,
        // category_id and trigger_id left null — add defaults if your schema requires them
      }));

      const { error: insertError } = await supabase
        .from(TABLE_NAME)
        .insert(rows)
        .select();

      if (insertError) {
        console.error(`[Cron] Insert failed:`, insertError);
        errors.push(`${user.user_id}: ${insertError.message}`);
      } else {
        totalInserted += count;
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
