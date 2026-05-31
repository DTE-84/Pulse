import { query } from "./db";

// Date Helpers
const subDays = (d: Date, days: number) => {
  const res = new Date(d);
  res.setDate(res.getDate() - days);
  return res;
};

const subMonths = (d: Date, months: number) => {
  const res = new Date(d);
  res.setMonth(res.getMonth() - months);
  return res;
};

const subHours = (d: Date, hours: number) => {
  const res = new Date(d);
  res.setHours(res.getHours() - hours);
  return res;
};

const setTime = (d: Date, h: number, m: number) => {
  const res = new Date(d);
  res.setHours(h, m, 0, 0);
  return res;
};

const addMonths = (d: Date, months: number) => {
  const res = new Date(d);
  res.setMonth(res.getMonth() + months);
  return res;
};

export async function seedGuestData(userId: string) {
  console.log(`[PULSE SEED] Initializing Signal Ingestion for Guest: ${userId}`);

  try {
    // 1. Ensure Categories Exist and map them
    const categories = [
      { name: "Dining", risk: "Medium" },
      { name: "Groceries", risk: "Low" },
      { name: "Shopping", risk: "High" },
      { name: "Transport", risk: "Low" },
      { name: "Entertainment", risk: "Medium" },
      { name: "Housing", risk: "Low" }
    ];

    const categoryMap: Record<string, number> = {};
    for (const cat of categories) {
      let res = await query("SELECT category_id FROM dim_categories WHERE category_name = $1 LIMIT 1", [cat.name]);
      if (res.rows.length === 0) {
        res = await query("INSERT INTO dim_categories (category_name, risk_level) VALUES ($1, $2) RETURNING category_id", [cat.name, cat.risk]);
      }
      categoryMap[cat.name] = res.rows[0].category_id;
    }

    // 2. Map Triggers
    const triggerRes = await query("SELECT trigger_id, trigger_name FROM dim_triggers");
    const triggerMap: Record<string, number> = {};
    triggerRes.rows.forEach((t: any) => {
      triggerMap[t.trigger_name] = t.trigger_id;
    });

    const now = new Date();
    
    // 3. Define Behavioral Nodes
    const nodes = [
      // Baseline (Last Month)
      { amount: 1200.00, cat: "Housing", date: subMonths(now, 1), tid: null },
      { amount: 165.20, cat: "Groceries", date: subMonths(now, 1), tid: null },
      { amount: 245.00, cat: "Shopping", date: subMonths(now, 1), tid: triggerMap["Stress"] || null },
      
      // Current Month Strategy
      { amount: 1200.00, cat: "Housing", date: now, tid: null },
      { amount: 84.30, cat: "Groceries", date: subDays(now, 4), tid: null },
      
      // Impulsivity Signal (Coffee Surge)
      { amount: 6.50, cat: "Dining", date: subHours(now, 24), tid: null },
      { amount: 7.25, cat: "Dining", date: subHours(now, 28), tid: null },
      
      // Risk Signal (Late Night)
      { amount: 52.00, cat: "Dining", date: setTime(subDays(now, 2), 23, 30), tid: triggerMap["Late Night"] || null },
      
      // High-Impact Impulse
      { amount: 189.99, cat: "Shopping", date: subDays(now, 1), tid: triggerMap["Stress"] || null }
    ];

    for (const node of nodes) {
      await query(
        `INSERT INTO fact_transactions (user_id, category_id, amount, purchase_date, trigger_id) 
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, categoryMap[node.cat] || categoryMap["Dining"], node.amount, node.date.toISOString(), node.tid]
      );
    }

    // 4. Add Foundational Goal
    await query(`
      INSERT INTO dim_goals (user_id, goal_name, target_amount, current_progress, deadline)
      VALUES ($1, 'Foundational Reserve', 5000.00, 1500.00, $2)
    `, [userId, addMonths(now, 4).toISOString().split('T')[0]]);

    console.log(`[PULSE SEED] Success for Guest: ${userId}`);
    return true;
  } catch (err) {
    console.error(`[PULSE SEED] Failed for Guest: ${userId}`, err);
    return false;
  }
}
