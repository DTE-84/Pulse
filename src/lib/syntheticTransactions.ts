// lib/syntheticTransactions.ts
// Generates realistic synthetic transactions for Pulse sandbox testing.
// Designed to give Nova meaningful behavioral patterns to analyze.

import crypto from 'crypto';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SyntheticTransaction {
  id: string;
  plaid_transaction_id: string;   // ← adjust to match your column name
  account_id: string;             // ← adjust to match your column name
  user_id: string;
  name: string;
  merchant_name: string;
  amount: number;                 // positive = debit (expense), negative = credit
  date: string;                   // YYYY-MM-DD
  datetime: string;               // ISO 8601
  category: string[];             // Plaid-style category array
  personal_finance_category: string;
  pending: boolean;
  is_synthetic: boolean;          // flag so you can filter these out later
  created_at: string;
}

// ─── Merchant Pool ────────────────────────────────────────────────────────────
// Organized by behavioral category so Nova has clean signal to analyze.

const MERCHANTS = {
  // Recurring / subscriptions — predictable, low emotion
  subscription: [
    { name: 'Netflix',          category: ['Service', 'Subscription'],  finance_cat: 'ENTERTAINMENT',      range: [15.99, 15.99] },
    { name: 'Spotify',          category: ['Service', 'Subscription'],  finance_cat: 'ENTERTAINMENT',      range: [9.99,  9.99]  },
    { name: 'Amazon Prime',     category: ['Service', 'Subscription'],  finance_cat: 'GENERAL_MERCHANDISE',range: [14.99, 14.99] },
    { name: 'Apple iCloud',     category: ['Service', 'Subscription'],  finance_cat: 'GENERAL_SERVICES',   range: [0.99,  9.99]  },
    { name: 'YouTube Premium',  category: ['Service', 'Subscription'],  finance_cat: 'ENTERTAINMENT',      range: [13.99, 13.99] },
    { name: 'Adobe Creative',   category: ['Service', 'Subscription'],  finance_cat: 'GENERAL_SERVICES',   range: [54.99, 54.99] },
  ],

  // Food & drink — high frequency, emotional spending patterns
  food: [
    { name: 'Starbucks',        category: ['Food and Drink', 'Coffee'], finance_cat: 'FOOD_AND_DRINK',     range: [4.50, 8.75]  },
    { name: "McDonald's",       category: ['Food and Drink', 'Restaurants'], finance_cat: 'FOOD_AND_DRINK',range: [7.00, 14.00] },
    { name: "Chick-fil-A",      category: ['Food and Drink', 'Restaurants'], finance_cat: 'FOOD_AND_DRINK',range: [9.00, 18.00] },
    { name: 'Chipotle',         category: ['Food and Drink', 'Restaurants'], finance_cat: 'FOOD_AND_DRINK',range: [10.00, 16.00]},
    { name: 'Panera Bread',     category: ['Food and Drink', 'Restaurants'], finance_cat: 'FOOD_AND_DRINK',range: [8.00, 14.00] },
    { name: 'Subway',           category: ['Food and Drink', 'Restaurants'], finance_cat: 'FOOD_AND_DRINK',range: [7.00, 12.00] },
  ],

  // Delivery — impulse signal, often late night
  delivery: [
    { name: 'DoorDash',         category: ['Food and Drink', 'Delivery'], finance_cat: 'FOOD_AND_DRINK',   range: [22.00, 48.00] },
    { name: 'Uber Eats',        category: ['Food and Drink', 'Delivery'], finance_cat: 'FOOD_AND_DRINK',   range: [20.00, 45.00] },
    { name: 'Grubhub',          category: ['Food and Drink', 'Delivery'], finance_cat: 'FOOD_AND_DRINK',   range: [18.00, 42.00] },
    { name: 'Instacart',        category: ['Food and Drink', 'Delivery'], finance_cat: 'FOOD_AND_DRINK',   range: [55.00, 110.00]},
  ],

  // Shopping — discretionary, variable amounts
  shopping: [
    { name: 'Amazon',           category: ['Shops', 'Online Stores'],   finance_cat: 'GENERAL_MERCHANDISE',range: [12.00, 180.00]},
    { name: 'Target',           category: ['Shops', 'Supermarkets'],    finance_cat: 'GENERAL_MERCHANDISE',range: [28.00, 95.00] },
    { name: 'Walmart',          category: ['Shops', 'Supermarkets'],    finance_cat: 'GENERAL_MERCHANDISE',range: [35.00, 120.00]},
    { name: 'Best Buy',         category: ['Shops', 'Electronics'],     finance_cat: 'GENERAL_MERCHANDISE',range: [25.00, 250.00]},
    { name: 'Home Depot',       category: ['Shops', 'Hardware'],        finance_cat: 'HOME_IMPROVEMENT',   range: [18.00, 140.00]},
  ],

  // Groceries — necessary spend baseline
  grocery: [
    { name: 'Kroger',           category: ['Shops', 'Supermarkets'],    finance_cat: 'GROCERIES',          range: [45.00, 130.00]},
    { name: 'Aldi',             category: ['Shops', 'Supermarkets'],    finance_cat: 'GROCERIES',          range: [30.00, 85.00] },
    { name: 'Whole Foods',      category: ['Shops', 'Supermarkets'],    finance_cat: 'GROCERIES',          range: [60.00, 155.00]},
    { name: "Sam's Club",       category: ['Shops', 'Supermarkets'],    finance_cat: 'GROCERIES',          range: [65.00, 180.00]},
  ],

  // Gas & transport
  transport: [
    { name: 'Shell',            category: ['Travel', 'Gas Stations'],   finance_cat: 'GAS_AND_CONVENIENCE',range: [38.00, 75.00] },
    { name: 'Casey\'s',         category: ['Travel', 'Gas Stations'],   finance_cat: 'GAS_AND_CONVENIENCE',range: [35.00, 68.00] },
    { name: 'Uber',             category: ['Travel', 'Taxi'],           finance_cat: 'TRANSPORTATION',     range: [10.00, 32.00] },
    { name: 'QuikTrip',         category: ['Travel', 'Gas Stations'],   finance_cat: 'GAS_AND_CONVENIENCE',range: [36.00, 72.00] },
  ],

  // Occasional credits (income/refunds) — negative amounts
  credit: [
    { name: 'Direct Deposit',   category: ['Transfer', 'Payroll'],      finance_cat: 'INCOME',             range: [-1200.00, -2800.00] },
    { name: 'Venmo',            category: ['Transfer', 'Third Party'],  finance_cat: 'TRANSFER_IN',        range: [-20.00, -200.00]    },
    { name: 'Zelle',            category: ['Transfer', 'Third Party'],  finance_cat: 'TRANSFER_IN',        range: [-25.00, -150.00]    },
    { name: 'Amazon Refund',    category: ['Shops', 'Online Stores'],   finance_cat: 'GENERAL_MERCHANDISE',range: [-15.00, -80.00]     },
  ],
};

// ─── Time-of-Day Behavioral Weighting ─────────────────────────────────────────
// Makes Nova's behavioral analysis meaningful — delivery spikes at night,
// coffee spikes at morning, etc.

function getWeightedMerchantPool(hour: number): typeof MERCHANTS[keyof typeof MERCHANTS] {
  if (hour >= 6 && hour < 10) {
    // Morning: coffee-heavy
    return [...MERCHANTS.food, ...MERCHANTS.food, ...MERCHANTS.transport];
  } else if (hour >= 10 && hour < 14) {
    // Midday: lunch + shopping
    return [...MERCHANTS.food, ...MERCHANTS.shopping, ...MERCHANTS.grocery];
  } else if (hour >= 14 && hour < 18) {
    // Afternoon: shopping + errands
    return [...MERCHANTS.shopping, ...MERCHANTS.grocery, ...MERCHANTS.transport, ...MERCHANTS.subscription];
  } else if (hour >= 18 && hour < 22) {
    // Evening: dinner + delivery
    return [...MERCHANTS.food, ...MERCHANTS.delivery, ...MERCHANTS.shopping];
  } else {
    // Late night: delivery + impulse = behavioral finance gold
    return [...MERCHANTS.delivery, ...MERCHANTS.delivery, ...MERCHANTS.shopping, ...MERCHANTS.subscription];
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Main Generator ───────────────────────────────────────────────────────────

export function generateTransactions(
  userId: string,
  accountId: string,
  count: number = 3
): SyntheticTransaction[] {
  const transactions: SyntheticTransaction[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    // Spread transactions across the last 0–4 hours for realism
    const minutesAgo = randomInt(0, 240);
    const txDate = new Date(now.getTime() - minutesAgo * 60 * 1000);
    const hour = txDate.getHours();

    // Occasional credit (~15% chance)
    const isCredit = Math.random() < 0.15;
    const pool = isCredit ? MERCHANTS.credit : getWeightedMerchantPool(hour);
    const merchant = pick(pool);
    const amount = randomBetween(merchant.range[0], merchant.range[1]);

    // Small chance of pending
    const isPending = Math.random() < 0.2;

    const txId = crypto.randomUUID();
    transactions.push({
      id: txId,
      plaid_transaction_id: `sandbox_${crypto.randomUUID().replace(/-/g, '')}`,
      account_id: accountId,
      user_id: userId,
      name: merchant.name,
      merchant_name: merchant.name,
      amount,
      date: txDate.toISOString().split('T')[0],
      datetime: txDate.toISOString(),
      category: merchant.category,
      personal_finance_category: merchant.finance_cat,
      pending: isPending,
      is_synthetic: true,
      created_at: new Date().toISOString(),
    });
  }

  return transactions;
}

// ─── Batch Generator (for seeding) ───────────────────────────────────────────
// Use this once to backfill 30 days of history so Nova has context from day 1.

export function generateHistoricalSeed(
  userId: string,
  accountId: string,
  daysBack: number = 30
): SyntheticTransaction[] {
  const transactions: SyntheticTransaction[] = [];
  const now = new Date();

  for (let day = daysBack; day >= 0; day--) {
    // 3–8 transactions per day, more on weekends
    const date = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const txCount = randomInt(isWeekend ? 4 : 2, isWeekend ? 8 : 6);

    // Add a paycheck on 1st and 15th
    const dayOfMonth = date.getDate();
    if (dayOfMonth === 1 || dayOfMonth === 15) {
      const payDate = new Date(date);
      payDate.setHours(9, 0, 0, 0);
      transactions.push({
        id: crypto.randomUUID(),
        plaid_transaction_id: `sandbox_${crypto.randomUUID().replace(/-/g, '')}`,
        account_id: accountId,
        user_id: userId,
        name: 'Direct Deposit',
        merchant_name: 'Direct Deposit',
        amount: randomBetween(-1800, -2600),
        date: payDate.toISOString().split('T')[0],
        datetime: payDate.toISOString(),
        category: ['Transfer', 'Payroll'],
        personal_finance_category: 'INCOME',
        pending: false,
        is_synthetic: true,
        created_at: new Date().toISOString(),
      });
    }

    for (let t = 0; t < txCount; t++) {
      const hour = randomInt(7, 23);
      const txDate = new Date(date);
      txDate.setHours(hour, randomInt(0, 59), 0, 0);

      const pool = getWeightedMerchantPool(hour);
      const merchant = pick(pool);
      const amount = randomBetween(merchant.range[0], merchant.range[1]);

      transactions.push({
        id: crypto.randomUUID(),
        plaid_transaction_id: `sandbox_${crypto.randomUUID().replace(/-/g, '')}`,
        account_id: accountId,
        user_id: userId,
        name: merchant.name,
        merchant_name: merchant.name,
        amount,
        date: txDate.toISOString().split('T')[0],
        datetime: txDate.toISOString(),
        category: merchant.category,
        personal_finance_category: merchant.finance_cat,
        pending: false,
        is_synthetic: true,
        created_at: new Date().toISOString(),
      });
    }
  }

  return transactions;
}
