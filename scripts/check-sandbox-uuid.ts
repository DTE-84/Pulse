// scripts/check-sandbox-uuid.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const sb = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SANDBOX_UUID = process.env.SANDBOX_USER_ID || 'ddeaa710-caf5-4b3f-949c-5e1e27b0959b';
const DREW_UUID = 'fe67369a-fd48-4634-bc04-42da3a8ced63';

async function check() {
  console.log(`\n🔍 Checking SANDBOX_USER_ID: ${SANDBOX_UUID}\n`);

  // 1. dim_users check
  const { data: u } = await sb.from('dim_users').select('user_id, email, onboarding_completed').eq('user_id', SANDBOX_UUID).maybeSingle();
  console.log('dim_users:', u ?? '❌ NOT FOUND');

  // 2. fact_transactions count
  const { data: txs } = await sb.from('fact_transactions').select('transaction_id').eq('user_id', SANDBOX_UUID);
  console.log('fact_transactions count:', txs?.length ?? 0);

  // 3. Supabase auth check
  const { data: authData, error: authErr } = await sb.auth.admin.getUserById(SANDBOX_UUID);
  console.log('auth.users:', authData?.user?.email ?? '❌ NOT FOUND', '| Error:', authErr?.message ?? 'none');

  // 4. Drew's UUID for comparison
  console.log(`\n📊 Comparison — Drew UUID: ${DREW_UUID}`);
  const { data: drew } = await sb.from('dim_users').select('user_id, email').eq('user_id', DREW_UUID).maybeSingle();
  console.log('Drew dim_users:', drew ?? '❌ NOT FOUND');

  const { data: drewTx } = await sb.from('fact_transactions').select('transaction_id').eq('user_id', DREW_UUID);
  console.log('Drew tx count:', drewTx?.length ?? 0);

  // 5. This month's transactions for sandbox
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { data: monthTx } = await sb.from('fact_transactions').select('transaction_id, amount').eq('user_id', SANDBOX_UUID).gte('purchase_date', monthStart);
  console.log(`\nSandbox this-month tx count: ${monthTx?.length ?? 0}`);

  process.exit(0);
}

check().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
