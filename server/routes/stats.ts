import { RequestHandler } from "express";
import { query } from "../db/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dte-high-fidelity-secret";

export const handleStats: RequestHandler = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authentication required." });

  const token = authHeader.split(" ")[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    // Fetch User baseline, tone, and income
    const userRes = await query(`
      SELECT 
        baseline_spend, 
        nova_tone,
        COALESCE(monthly_income, 5200.00) as monthly_income,
        COALESCE(initial_balance, 15000.00) as initial_balance
      FROM dim_users 
      WHERE user_id = $1
    `, [userId]);
    const user = userRes.rows[0];

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Calculate Total Spend (Lifetime)
    const lifetimeRes = await query(`
      SELECT COALESCE(SUM(amount), 0) as lifetime_spend
      FROM fact_transactions
      WHERE user_id = $1
    `, [userId]);
    const lifetimeSpend = parseFloat(lifetimeRes.rows[0].lifetime_spend);

    // Calculate Month Spend
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    const statsRes = await query(`
      SELECT 
        COALESCE(SUM(amount), 0) as current_month_spend,
        COUNT(*) as transaction_count
      FROM fact_transactions
      WHERE user_id = $1 AND purchase_date >= $2
    `, [userId, monthStart]);

    const currentMonthSpend = parseFloat(statsRes.rows[0].current_month_spend);

    // Fetch Chart Data (last 7 days)
    const chartRes = await query(`
      SELECT 
        TO_CHAR(purchase_date, 'DY') as day,
        SUM(amount) as value
      FROM fact_transactions
      WHERE user_id = $1 AND purchase_date >= NOW() - INTERVAL '7 days'
      GROUP BY TO_CHAR(purchase_date, 'DY'), EXTRACT(DOW FROM purchase_date)
      ORDER BY EXTRACT(DOW FROM purchase_date)
    `, [userId]);

    const chartData = chartRes.rows.map(row => ({
      day: row.day.charAt(0).toUpperCase(),
      value: parseFloat(row.value)
    }));

    // Dynamic Balance Calculation (Initial + Monthly Income - Lifetime Spend)
    const totalBalance = parseFloat(user.initial_balance) - lifetimeSpend;

    // Predicted End of Month
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const daysRemaining = daysInMonth - dayOfMonth;
    const dailyVelocity = currentMonthSpend / (dayOfMonth || 1);
    const projectedAdditionalSpend = dailyVelocity * daysRemaining;
    const predictedBalance = totalBalance - projectedAdditionalSpend;

    // Dynamic Insights and Triggers
    let triggers = [];
    const baseline = parseFloat(user.baseline_spend);
    const dailyBaseline = baseline / 30;
    
    if (currentMonthSpend > baseline) {
        triggers.push({ 
            id: 1, 
            name: "Baseline Breach", 
            impact: (currentMonthSpend - baseline).toFixed(2), 
            status: "Critical", 
            insight: "You have exceeded your target monthly rhythm." 
        });
    }

    if (dailyVelocity > (dailyBaseline * 1.5)) {
        triggers.push({ 
            id: 2, 
            name: "High Velocity", 
            impact: dailyVelocity.toFixed(2), 
            status: "Active", 
            insight: "Current daily spending is 50% above your strategic protocol." 
        });
    }

    if (triggers.length === 0) {
        triggers.push({ 
            id: 0, 
            name: "Rhythm Stable", 
            impact: 0, 
            status: "Optimal", 
            insight: "No deviations detected in your capital trajectory." 
        });
    }

    const insight = user.nova_tone === "Aggressive" 
        ? `Nova (Aggressive): Capital leak detected. You are $${(currentMonthSpend - baseline).toFixed(2)} off protocol.`
        : `Nova (Balanced): Your spending rhythm is $${currentMonthSpend.toFixed(2)}. Monitoring for drift.`;

    res.json({
        totalBalance: Number(totalBalance.toFixed(2)),
        monthlyIncome: parseFloat(user.monthly_income),
        monthlyExpenses: currentMonthSpend,
        predictedEndOfMonthBalance: Math.max(0, Number(predictedBalance.toFixed(2))),
        baselineSpend: baseline,
        novaTone: user.nova_tone,
        novaInsight: insight,
        triggers,
        chartData: chartData.length > 0 ? chartData : [
            { day: "M", value: 0 }, { day: "T", value: 0 }, { day: "W", value: 0 },
            { day: "T", value: 0 }, { day: "F", value: 0 }, { day: "S", value: 0 }, { day: "S", value: 0 }
        ]
    });

  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ error: "Could not calculate telemetry statistics." });
  }
};
