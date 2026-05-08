import { query } from "./db";

const DREW_USER_ID = "fe67369a-fd48-4634-bc04-42da3a8ced63";

async function activateNovaSignals() {
  console.log("🚀 Initializing High-Fidelity Signal Ingestion for User: " + DREW_USER_ID);

  try {
    // 1. Ensure Categories Exist
    const categories = [
      { name: "Dining", risk: "Medium" },
      { name: "Groceries", risk: "Low" },
      { name: "Shopping", risk: "High" },
      { name: "Transport", risk: "Low" },
      { name: "Entertainment", risk: "Medium" }
    ];

    const categoryMap: Record<string, number> = {};
    for (const cat of categories) {
      let res = await query("SELECT category_id FROM dim_categories WHERE category_name = $1 LIMIT 1", [cat.name]);
      if (res.rows.length === 0) {
        res = await query("INSERT INTO dim_categories (category_name, risk_level) VALUES ($1, $2) RETURNING category_id", [cat.name, cat.risk]);
      }
      categoryMap[cat.name] = res.rows[0].category_id;
    }

    // 2. Define High-Fidelity Behavioral Nodes
    const now = new Date();
    const nodes = [
      // --- LAST MONTH (To establish a baseline for 'Improvement' logic) ---
      { amount: 150.00, cat: "Groceries", date: subMonths(now, 1), tid: null },
      { amount: 200.00, cat: "Shopping", date: subMonths(now, 1), tid: 1 }, // Stress Shopping
      { amount: 80.00, cat: "Dining", date: subMonths(now, 1), tid: 5 },   // Late Night
      { amount: 1200.00, cat: "Rent", date: subMonths(now, 1), tid: null },

      // --- CURRENT MONTH (Nodes that indicate a 'Strategic Shift') ---
      { amount: 1200.00, cat: "Rent", date: now, tid: null },
      { amount: 95.50, cat: "Groceries", date: subDays(now, 5), tid: null },
      
      // --- High-Velocity Coffee Surge (Signal: Impulsivity) ---
      { amount: 6.75, cat: "Dining", date: subHours(now, 48), tid: null },
      { amount: 5.50, cat: "Dining", date: subHours(now, 44), tid: null },
      { amount: 8.20, cat: "Dining", date: subHours(now, 40), tid: null },
      
      // --- Late Night Stress Trigger (Signal: Behavioral Drift) ---
      { amount: 42.50, cat: "Dining", date: setTime(subDays(now, 1), 23, 15), tid: 5 }, // Late Night
      { amount: 15.00, cat: "Entertainment", date: setTime(subDays(now, 1), 23, 45), tid: 5 },
      
      // --- The 'Impulse Surge' Node ---
      { amount: 199.00, cat: "Shopping", date: subDays(now, 2), tid: 1 } // Stress Shopping
    ];

    console.log(`📡 Mapping ${nodes.length} behavioral nodes...`);

    for (const node of nodes) {
      await query(
        `INSERT INTO fact_transactions (user_id, category_id, amount, purchase_date, status, trigger_id) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [DREW_USER_ID, categoryMap[node.cat] || categoryMap["Dining"], node.amount, node.date.toISOString(), "Completed", node.tid]
      );
    }

    // 3. Add a Mock Goal for 'Goal Acceleration' logic
    await query(`
      INSERT INTO dim_goals (user_id, goal_name, target_amount, current_progress, deadline)
      VALUES ($1, 'Foundational Reserve', 5000.00, 1200.00, $2)
      ON CONFLICT DO NOTHING
    `, [DREW_USER_ID, addMonths(now, 6).toISOString().split('T')[0]]);

    console.log("✅ Uplink Successful. User profile is now 'Signal-Rich'.");
    console.log("👉 ACTION: Refresh Pulse and click 'Run Deep Scan' in Nova Chat.");

  } catch (err) {
    console.error("❌ Signal Ingestion Failed:", err);
  } finally {
    process.exit();
  }
}

// --- Date Helpers ---
function subDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

function subMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() - months);
  return d;
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function subHours(date: Date, hours: number) {
  const d = new Date(date);
  d.setHours(d.getHours() - hours);
  return d;
}

function setTime(date: Date, h: number, m: number) {
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

activateNovaSignals();
