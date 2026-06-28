import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const { data } = await sb.from('dim_categories').select('category_id, category_name').order('category_name');
console.log('All categories in dim_categories:');
data?.forEach((c: any) => console.log(`  [${c.category_id}] ${c.category_name}`));

// Also check what the synthetic generator produces
const { generateTransactions } = await import('../src/lib/syntheticTransactions.js');
const sample = generateTransactions('test', 'test', 20);
const cats = [...new Set(sample.map((t: any) => t.personal_finance_category))];
console.log('\nSynthetic generator category names:');
cats.forEach(c => console.log(`  ${c}`));
process.exit(0);
