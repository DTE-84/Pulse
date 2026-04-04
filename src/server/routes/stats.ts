import { RequestHandler } from "express";
import { query } from "../db/db";
import jwt from "jsonwebtoken";

import { JWT_SECRET } from "../middleware/security";

const buildNovaMessage = ({
  mode,
  currentMonthSpend,
  baseline,
  _predictedBalance,
  goalLabel,
}: {
  mode: string;
  currentMonthSpend: number;
  baseline: number;
  _predictedBalance: number;
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
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authentication required." });

  const token = authHeader.split(" ")[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

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
      WHERE user_id = $1 AND purchase_date >= $2
    `,
      [userId, monthStart]
    );

    const currentMonthSpend = parseFloat(statsRes.rows[0].current_month_spend);

    const chartRes = await query(
      `
      SELECT 
        TO_CHAR(purchase_date, 'DY') as day,
        SUM(amount) as value
      FROM fact_transactions
      WHERE user_id = $1 AND purchase_date >= NOW() - INTERVAL '7 days'
      GROUP BY TO_CHAR(purchase_date, 'DY'), EXTRACT(DOW FROM purchase_date)
      ORDER BY EXTRACT(DOW FROM purchase_date)
    `,
      [userId]
    );

    const chartData = chartRes.rows.map((row) => ({
      day: row.day.charAt(0).toUpperCase(),
      value: parseFloat(row.value),
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
      _predictedBalance: predictedBalance,
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
