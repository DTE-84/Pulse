import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const users = await pool.query("SELECT * FROM dim_users LIMIT 1");
    if (users.rows.length > 0) {
      const user = users.rows[0];
      const userId = user.user_id;
      
      console.log(`Testing with user_id: ${userId} (type: ${typeof userId})`);

      try {
        console.log("Running stats query: current_month_spend...");
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        
        await pool.query(
          `
          SELECT 
            COALESCE(SUM(amount), 0) as current_month_spend,
            COUNT(*) as transaction_count
          FROM fact_transactions
          WHERE user_id = $1 AND purchase_date >= $2
        `,
          [userId, monthStart]
        );
        console.log("stats query (current_month_spend) success!");
      } catch (e: any) {
        console.error("stats query (current_month_spend) failed:", e.message);
      }

      try {
        console.log("Running Plaid syncTransactions INSERT test...");
        await pool.query(
          `INSERT INTO fact_transactions (user_id, category_id, amount, purchase_date, merchant_name, external_id, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (external_id) DO NOTHING`,
          [
            userId,
            1,
            10.50,
            new Date().toISOString(),
            "Starbucks",
            "test_external_id",
            "Completed"
          ]
        );
        console.log("Plaid syncTransactions success!");
      } catch (e: any) {
        console.error("Plaid syncTransactions failed:", e.message);
      }
    }
  } catch (err: any) {
    console.error("General error:", err.message);
  } finally {
    await pool.end();
  }
}

run();
