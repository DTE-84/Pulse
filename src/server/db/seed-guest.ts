import { query } from "./db.js";

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
    // 0. Duplicate Seed Guard
    const existingTx = await query(
      "SELECT COUNT(*) as count FROM fact_transactions WHERE user_id = $1",
      [userId]
    );
    if (parseInt(existingTx.rows[0].count) > 0) {
      console.log(`[PULSE SEED] Data already exists for ${userId}, skipping.`);
      return true;
    }

    // 1. Ensure Categories Exist and map them (Optimized Batch Check)
    const categories = [
      { name: "Dining", risk: "Medium" },
      { name: "Groceries", risk: "Low" },
      { name: "Shopping", risk: "High" },
      { name: "Transport", risk: "Low" },
      { name: "Entertainment", risk: "Medium" },
      { name: "Housing", risk: "Low" }
    ];

    const catNames = categories.map(c => c.name);
    const existingCatsRes = await query(
      "SELECT category_id, category_name FROM dim_categories WHERE category_name = ANY($1)",
      [catNames]
    );
    
    const categoryMap: Record<string, number> = {};
    existingCatsRes.rows.forEach((r: any) => {
      categoryMap[r.category_name] = r.category_id;
    });

    for (const cat of categories) {
      if (!categoryMap[cat.name]) {
        try {
          const res = await query(
            "INSERT INTO dim_categories (category_name, risk_level) VALUES ($1, $2) RETURNING category_id", 
            [cat.name, cat.risk]
          );
          if (res.rows[0]) {
            categoryMap[cat.name] = res.rows[0].category_id;
          }
        } catch (catErr: any) {
          console.warn(`[PULSE SEED] Could not ensure category ${cat.name}:`, catErr.message);
        }
      }
    }

    // 2. Map Triggers
    const triggerRes = await query("SELECT trigger_id, trigger_name FROM dim_triggers");
    const triggerMap: Record<string, number> = {};
    triggerRes.rows.forEach((t: any) => {
      triggerMap[t.trigger_name] = t.trigger_id;
    });

    if (!triggerMap["Stress"]) {
      console.warn("[PULSE SEED] 'Stress' trigger not found in dim_triggers — behavioral signals will be untagged.");
    }
    if (!triggerMap["Late Night"]) {
      console.warn("[PULSE SEED] 'Late Night' trigger not found in dim_triggers — behavioral signals will be untagged.");
    }

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

    // Optimize with Batch Insert
    const values: any[] = [];
    const validNodes = nodes.filter(node => {
      const cid = categoryMap[node.cat] || categoryMap["Dining"] || Object.values(categoryMap)[0];
      return cid !== undefined;
    });

    if (validNodes.length === 0) {
      console.warn("[PULSE SEED] No valid categories found to seed data.");
    } else {
      const valuePlaceholders = validNodes.map((node, i) => {
        const offset = i * 5;
        const cid = categoryMap[node.cat] || categoryMap["Dining"] || Object.values(categoryMap)[0];
        values.push(userId, cid, node.amount, node.date.toISOString(), node.tid);
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`;
      }).join(", ");

      await query(
        `INSERT INTO fact_transactions (user_id, category_id, amount, purchase_date, trigger_id) 
         VALUES ${valuePlaceholders}`,
        values
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
