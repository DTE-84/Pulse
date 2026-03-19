import { RequestHandler } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const handleStats: RequestHandler = (req, res) => {
  // In a real app, we'd get the user from the request session/token
  const user = (req as any).user || {
    baselineSpend: 2500,
    novaTone: "Balanced",
    intentions: ["Wealth Accrual"]
  };

  const dbPath = path.resolve(__dirname, "../db/pulse_ingest.csv");
  
  let totalBalance = 0;
  let currentMonthSpend = 0;
  let dailyVelocity = 0;
  let behavioralScore = 0;
  let transactionCount = 0;

  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, "utf-8");
      const rows = data.split("\n").slice(1).filter(row => row.trim() !== "");
      
      rows.forEach(row => {
        const columns = row.split(",");
        // CSV: date,amount,category,risk_category,behavioral_ordinal,rolling_velocity
        const amount = parseFloat(columns[1]);
        const ordinal = parseFloat(columns[4]);
        
        if (!isNaN(amount)) currentMonthSpend += amount;
        if (!isNaN(ordinal)) {
            behavioralScore += ordinal;
            transactionCount++;
        }
      });
      
      if (transactionCount > 0) {
        behavioralScore = behavioralScore / transactionCount;
      }
      // Natural Balance Logic: Start at a baseline and subtract ingested spend
      const baseBalance = 15000.00;
      totalBalance = baseBalance - currentMonthSpend; 
    } else {
        // Empty state for demo
        currentMonthSpend = 0; 
        behavioralScore = 0; 
    }
  } catch (err) {
    console.error("Error reading pulse_ingest.csv:", err);
  }

  // Determine Nova Tone based on behavioral score
  if (behavioralScore > 2.5) user.novaTone = "Aggressive";
  else if (behavioralScore > 0 && behavioralScore < 1.5) user.novaTone = "Conservative";
  else user.novaTone = "Balanced";


  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysRemaining = daysInMonth - dayOfMonth;
  
  dailyVelocity = currentMonthSpend / (dayOfMonth || 1); // Avoid div by 0
  const projectedAdditionalSpend = dailyVelocity * daysRemaining;
  const predictedBalance = totalBalance - currentMonthSpend - (projectedAdditionalSpend > 0 ? projectedAdditionalSpend : 0);

  // Generate dynamic triggers based on Nova Tone
  let triggers = [];
  let insight = "";

  if (user.novaTone === "Aggressive") {
    triggers = [
      { id: 1, name: "Velocity Breach", impact: 450, status: "Critical", insight: "Spending is 15% above target velocity. Immediate pause recommended." },
      { id: 2, name: "Capital Leak", impact: 120, status: "Active", insight: "Subscription bloat detected. Pruning required for Wealth Accrual." }
    ];
    insight = "Nova (Aggressive): You're drifting from your baseline. Tighten the perimeter or your end-of-month target is compromised.";
  } else if (user.novaTone === "Conservative") { // Map back to Empathetic logic for now
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
