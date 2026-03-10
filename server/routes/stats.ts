import { RequestHandler } from "express";

export const handleStats: RequestHandler = (req, res) => {
  // Mock data for demo purposes, would connect to DB/Plaid in production
  const totalBalance = 12450.80;
  
  // Calculate predicted end of month balance based on current spending velocity
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.month + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysRemaining = daysInMonth - dayOfMonth;
  
  const currentMonthSpend = 3240.00;
  const dailyVelocity = currentMonthSpend / dayOfMonth;
  const projectedAdditionalSpend = dailyVelocity * daysRemaining;
  
  const predictedBalance = totalBalance - projectedAdditionalSpend;

  res.json({
    totalBalance,
    monthlyIncome: 5200.00,
    monthlyExpenses: currentMonthSpend,
    predictedEndOfMonthBalance: Math.max(0, Number(predictedBalance.toFixed(2))),
    triggers: [
      { id: 1, name: "Stress Eating", status: "Active" },
      { id: 2, name: "Late Night Shopping", status: "Active" }
    ]
  });
};
