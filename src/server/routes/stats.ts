import { RequestHandler } from "express";
import { query } from "../db/db.js";

const buildNovaMessage = ({
  mode,
  currentMonthSpend,
  baseline,
  goalLabel,
}: {
  mode: string;
  currentMonthSpend: number;
  baseline: number;
  goalLabel: string;
}) => {
  const delta = currentMonthSpend - baseline;
  const over = delta > 0;
  const diff = Math.abs(delta).toFixed(2);

  const normalizedMode = (mode || "Balanced").toLowerCase();

  if (!over) {
    if (normalizedMode === "gentle") {
      return `You’re spending below your usual baseline this month, and that’s giving your ${goalLabel} more room to breathe. Keep stacking small wins like this.`;
    }
    if (normalizedMode === "driven") {
      return `You’re under baseline this month. Keep pressing this advantage and turn today’s discipline into faster progress toward your ${goalLabel}.`;
    }
    return `Your spending is staying under baseline this month. If you keep this pace, you give your ${goalLabel} more room to move forward.`;
  }

  if (normalizedMode === "gentle") {
    return `You’re currently $${diff} above your monthly baseline. This isn’t failure — it’s a signal. A few calmer decisions now can protect your progress toward ${goalLabel}.`;
  }
  if (normalizedMode === "driven") {
    return `You’re $${diff} above baseline right now. Catch the drift early, tighten the next few decisions, and get your ${goalLabel} back in range.`;
  }
  return `You’re currently $${diff} above your monthly baseline. It’s worth tightening up now so your ${goalLabel} doesn’t keep slipping further out.`;
};

export const handleStats: RequestHandler = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Authentication required." });

    const userRes = await query(
      `
      SELECT 
        baseline_spend, 
        nova_tone,
        COALESCE(monthly_income, 5200.00) as monthly_income,
        COALESCE(initial_balance, 15000.00) as initial_balance
      FROM dim_users 
      WHERE user_id = $1
    `,
      [userId]
    );
    const user = userRes.rows[0];

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const lifetimeRes = await query(
      `
      SELECT COALESCE(SUM(amount), 0) as lifetime_spend
      FROM fact_transactions
      WHERE user_id = $1
    `,
      [userId]
    );
    const lifetimeSpend = parseFloat(lifetimeRes.rows[0].lifetime_spend);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const statsRes = await query(
      `
      SELECT 
        COALESCE(SUM(amount), 0) as current_month_spend,
        COUNT(*) as transaction_count
      FROM fact_transactions
      WHERE user_id = $1 
        AND purchase_date >= $2
        AND amount > 0
    `,
      [userId, monthStart]
    );

    const currentMonthSpend = parseFloat(statsRes.rows[0].current_month_spend);

    const chartRes = await query(
      `
      SELECT 
        TO_CHAR(DATE(purchase_date), 'DY') as day,
        SUM(amount) as value
      FROM fact_transactions
      WHERE user_id = $1 
        AND purchase_date >= NOW() - INTERVAL '7 days'
        AND amount > 0
      GROUP BY DATE(purchase_date), TO_CHAR(DATE(purchase_date), 'DY')
      ORDER BY DATE(purchase_date) ASC
    `,
      [userId]
    );

    const chartData = chartRes.rows.map((row: any) => ({
      day: row.day.charAt(0).toUpperCase(),
      value: parseFloat(row.value),
    }));

    const categoryRes = await query(
      `
      SELECT 
        CASE 
          WHEN c.category_name IN ('GENERAL_MERCHANDISE','Shops','Shopping') THEN 'Shopping'
          WHEN c.category_name IN ('FOOD_AND_DRINK','Food and Drink','Dining') THEN 'Dining'
          WHEN c.category_name IN ('GROCERIES','Groceries') THEN 'Groceries'
          WHEN c.category_name IN ('GAS_AND_CONVENIENCE','TRANSPORTATION','Transport','Travel') THEN 'Transport'
          WHEN c.category_name IN ('ENTERTAINMENT','Entertainment') THEN 'Entertainment'
          WHEN c.category_name IN ('HOME_IMPROVEMENT','Housing') THEN 'Housing'
          WHEN c.category_name IN ('GENERAL_SERVICES','Service') THEN 'Services'
          WHEN c.category_name IN ('INCOME','TRANSFER_IN','Transfer') THEN 'Income'
          ELSE 'Other'
        END as category_name,
        COALESCE(SUM(t.amount), 0) as total,
        COUNT(*) as count
      FROM fact_transactions t
      LEFT JOIN dim_categories c ON t.category_id = c.category_id
      WHERE t.user_id = $1 
        AND t.purchase_date >= $2
        AND t.amount > 0
        AND c.category_name NOT IN ('LoadTest','INCOME','TRANSFER_IN','Transfer')
      GROUP BY 1
      ORDER BY total DESC
      `,
      [userId, monthStart]
    );
    
    const CATEGORY_COLORS: Record<string, string> = {
      'Dining':        '#FB923C',
      'Groceries':     '#34D399',
      'Shopping':      '#60A5FA',
      'Transport':     '#FACC15',
      'Entertainment': '#A855F7',
      'Housing':       '#94A3B8',
      'Services':      '#F472B6',
      'Income':        '#10B981',
      'Other':         '#64748B',
    };
    
    const categoryBreakdown = categoryRes.rows.map((row: any) => {
      const total = parseFloat(row.total);
      return {
        name: row.category_name || 'Other',
        total: Number(total.toFixed(2)),
        count: Number(row.count),
        color: CATEGORY_COLORS[row.category_name] || '#64748B',
      };
    });
    
    // Add pct after totals are known
    const grandTotal = categoryBreakdown.reduce((sum: number, c: any) => sum + c.total, 0);
    const categoryBreakdownWithPct = categoryBreakdown.map((c: any) => ({
      ...c,
      value: grandTotal > 0 ? Math.round((c.total / grandTotal) * 100) : 0,
    }));

    const totalBalance = parseFloat(user.initial_balance) - lifetimeSpend;

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const daysRemaining = daysInMonth - dayOfMonth;
    const dailyVelocity = currentMonthSpend / (dayOfMonth || 1);
    const projectedAdditionalSpend = dailyVelocity * daysRemaining;
    const predictedEndOfMonthSpend = currentMonthSpend + projectedAdditionalSpend;
    const predictedBalance = totalBalance - projectedAdditionalSpend;

    const baseline = parseFloat(user.baseline_spend || 2500);
    const dailyBaseline = baseline / 30;
    const spendingDrift = currentMonthSpend - (dailyBaseline * dayOfMonth);
    const spendingDeltaPct = baseline > 0 ? ((currentMonthSpend - baseline) / baseline) * 100 : 0;

    const projection = {
      velocity: Number(dailyVelocity.toFixed(2)),
      projectedSpend: Number(predictedEndOfMonthSpend.toFixed(2)),
      drift: Number(spendingDrift.toFixed(2)),
      isHighVelocity: dailyVelocity > (dailyBaseline * 1.2)
    };

    const triggers = [];

    if (currentMonthSpend > baseline) {
      triggers.push({
        id: 1,
        name: "Baseline drift",
        impact: spendingDrift.toFixed(2),
        status: spendingDrift > baseline * 0.15 ? "High" : "Watch",
        insight: "Your spending is running above the monthly baseline you set for yourself.",
      });
    }

    if (dailyVelocity > dailyBaseline * 1.5) {
      triggers.push({
        id: 2,
        name: "High spending pace",
        impact: dailyVelocity.toFixed(2),
        status: "Active",
        insight: "Your daily spending pace is noticeably above your usual rhythm this month.",
      });
    }

    if (triggers.length === 0) {
      triggers.push({
        id: 0,
        name: "Steady rhythm",
        impact: "0.00",
        status: "Stable",
        insight: "Your spending is staying close to plan right now.",
      });
    }

    const goalLabel = "top goal";
    const novaInsight = buildNovaMessage({
      mode: user.nova_tone || "Balanced",
      currentMonthSpend,
      baseline,
      goalLabel,
    });

    res.json({
      totalBalance: Number(totalBalance.toFixed(2)),
      monthlyIncome: parseFloat(user.monthly_income),
      monthlyExpenses: currentMonthSpend,
      predictedEndOfMonthBalance: Math.max(0, Number(predictedBalance.toFixed(2))),
      baselineSpend: baseline,
      monthlyDiff: Number(spendingDrift.toFixed(2)),
      spendingDeltaPct: Number(spendingDeltaPct.toFixed(1)),
      transactionCount: Number(statsRes.rows[0].transaction_count),
      novaTone: user.nova_tone || "Balanced",
      novaInsight,
      triggers,
      projection,
      categoryBreakdown: categoryBreakdownWithPct,
      chartData:
        chartData.length > 0
          ? chartData
          : [
              { day: "M", value: 0 },
              { day: "T", value: 0 },
              { day: "W", value: 0 },
              { day: "T", value: 0 },
              { day: "F", value: 0 },
              { day: "S", value: 0 },
              { day: "S", value: 0 },
            ],
    });
  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ error: "Could not calculate dashboard statistics." });
  }
};
