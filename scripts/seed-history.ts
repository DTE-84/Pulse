import { query } from "../src/server/db/db.js";
import { generateHistoricalSeed } from "../src/lib/syntheticTransactions.js";

async function run() {
  console.log("Seeding realistic 30-day history...");
  
  const usersRes = await query("SELECT user_id FROM dim_users");
  const users = usersRes.rows;

  let totalInserted = 0;

  for (const user of users) {
    // Generate 30 days of data
    const txs = generateHistoricalSeed(user.user_id, "seeded_account_id", 30);
    
    if (txs.length === 0) continue;

    const values = txs.map(tx => [
      tx.user_id,
      tx.category_id,
      tx.amount,
      tx.datetime,
      tx.merchant_name,
      tx.plaid_transaction_id,
      'Completed',
      true // is_synthetic
    ]);

    // Construct bulk insert
    const insertQuery = `
      INSERT INTO fact_transactions (user_id, category_id, amount, purchase_date, merchant_name, external_id, status, is_synthetic)
      VALUES ${values.map((_, i) => `($${i * 8 + 1}, $${i * 8 + 2}, $${i * 8 + 3}, $${i * 8 + 4}, $${i * 8 + 5}, $${i * 8 + 6}, $${i * 8 + 7}, $${i * 8 + 8})`).join(', ')}
    `;

    const flatValues = values.flat();
    await query(insertQuery, flatValues);

    console.log(`Inserted ${txs.length} transactions for user ${user.user_id}`);
    totalInserted += txs.length;
  }

  console.log(`Done! Seeded a total of ${totalInserted} transactions.`);
}

run().catch(console.error);
