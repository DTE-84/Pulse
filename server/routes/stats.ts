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

    // Fetch User baseline and tone
    const userRes = await query("SELECT baseline_spend, nova_tone FROM dim_users WHERE user_id = $1", [userId]);
    const user = userRes.rows[0];

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

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
      day: row.day.charAt(0),
      value: parseFloat(row.value)
    }));

    // Dynamic Balance Calculation
    const baseBalance = 15000.00; 
    const totalBalance = baseBalance - currentMonthSpend;

    // Predicted End of Month
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const daysRemaining = daysInMonth - dayOfMonth;
    const dailyVelocity = currentMonthSpend / (dayOfMonth || 1);
    const projectedAdditionalSpend = dailyVelocity * daysRemaining;
    const predictedBalance = totalBalance - projectedAdditionalSpend;

    // Insights and Triggers
    let triggers = [];
    let insight = "";

    if (user.nova_tone === "Aggressive") {
        triggers = [
            { id: 1, name: "Velocity Breach", impact: 450, status: "Critical", insight: "Spending is above target velocity." }
        ];
        insight = `Nova (Aggressive): You've spent $${currentMonthSpend.toFixed(2)} this month. Tighten the perimeter.`;
    } else {
        triggers = [
            { id: 1, name: "Impulse Trajectory", impact: 210, status: "Active", insight: "Monitoring for discretionary patterns." }
        ];
        insight = `Nova (Balanced): Your spending rhythm is stable at $${currentMonthSpend.toFixed(2)} total spend.`;
    }

    res.json({
        totalBalance,
        monthlyIncome: 5200.00,
        monthlyExpenses: currentMonthSpend,
        predictedEndOfMonthBalance: Math.max(0, Number(predictedBalance.toFixed(2))),
        baselineSpend: parseFloat(user.baseline_spend),
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
