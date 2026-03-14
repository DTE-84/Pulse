import { RequestHandler } from "express";

export const handleStats: RequestHandler = (req, res) => {
  // In a real app, we'd get the user from the request session/token
  // For this polish, we'll assume a default or use the request body if available
  const user = (req as any).user || {
    baselineSpend: 2500,
    novaTone: "Balanced",
    intentions: ["Wealth Accrual"]
  };

  const totalBalance = 12450.80;
  
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysRemaining = daysInMonth - dayOfMonth;
  
  // Simulated current spend - in real app would come from DB/Plaid
  const currentMonthSpend = 2150.00;
  const dailyVelocity = currentMonthSpend / dayOfMonth;
  const projectedAdditionalSpend = dailyVelocity * daysRemaining;
  
  const predictedBalance = totalBalance - (projectedAdditionalSpend > 0 ? projectedAdditionalSpend : 0);

  // Generate dynamic triggers based on Nova Tone
  let triggers = [];
  let insight = "";

  if (user.novaTone === "Aggressive") {
    triggers = [
      { id: 1, name: "Velocity Breach", impact: 450, status: "Critical", insight: "Spending is 15% above target velocity. Immediate pause recommended." },
      { id: 2, name: "Capital Leak", impact: 120, status: "Active", insight: "Subscription bloat detected. Pruning required for Wealth Accrual." }
    ];
    insight = "Nova (Aggressive): You're drifting from your baseline. Tighten the perimeter or your end-of-month target is compromised.";
  } else if (user.novaTone === "Empathetic") {
    triggers = [
      { id: 1, name: "Self-Care Surge", impact: 85, status: "Monitored", insight: "Small uptick in comfort spending. Is this a stress response?" },
      { id: 2, name: "Rhythm Shift", impact: 40, status: "Active", insight: "Your morning pattern has changed. Let's find your balance again." }
    ];
    insight = "Nova (Empathetic): I've noticed a small shift in your rhythm. Take a breath; we'll adjust the baseline together.";
  } else {
    triggers = [
      { id: 1, name: "Impulse Trajectory", impact: 210, status: "Active", insight: "Detected 3 high-velocity transactions in 24h. Monitoring for pattern." },
      { id: 2, name: "Subscription Sync", impact: 55, status: "Active", insight: "Recurring digital service fees are consolidating. Reviewing impact." }
    ];
    insight = "Nova (Balanced): Your spending rhythm is largely stable, though I'm tracking a slight impulse trajectory in discretionary categories.";
  }

  res.json({
    totalBalance,
    monthlyIncome: 5200.00,
    monthlyExpenses: currentMonthSpend,
    predictedEndOfMonthBalance: Math.max(0, Number(predictedBalance.toFixed(2))),
    baselineSpend: user.baselineSpend,
    novaTone: user.novaTone,
    novaInsight: insight,
    triggers
  });
};
