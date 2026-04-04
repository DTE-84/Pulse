import { RequestHandler } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { query } from "../db/db";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../middleware/security";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || "");

export const handleAnalysis: RequestHandler = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authentication required." });

  const token = authHeader.split(" ")[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    // 1. Fetch High-Fidelity Telemetry
    const userRes = await query(
      `SELECT user_name, baseline_spend, monthly_income FROM dim_users WHERE user_id = $1`,
      [userId]
    );
    const user = userRes.rows[0];

    // Current Month vs Last Month Comparison
    const currentMonthRes = await query(
      `SELECT COALESCE(SUM(amount), 0) as spend FROM fact_transactions 
       WHERE user_id = $1 AND purchase_date >= DATE_TRUNC('month', CURRENT_DATE)`,
      [userId]
    );
    const lastMonthRes = await query(
      `SELECT COALESCE(SUM(amount), 0) as spend FROM fact_transactions 
       WHERE user_id = $1 AND purchase_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') 
       AND purchase_date < DATE_TRUNC('month', CURRENT_DATE)`,
      [userId]
    );

    const currentSpend = parseFloat(currentMonthRes.rows[0].spend);
    const lastMonthSpend = parseFloat(lastMonthRes.rows[0].spend);
    const income = parseFloat(user.monthly_income || 5200);
    
    const currentSavings = income - currentSpend;
    const lastMonthSavings = income - lastMonthSpend;
    const savingsImprovement = currentSavings - lastMonthSavings;

    // Fetch Active Goals
    const goalsRes = await query(
      `SELECT goal_name, target_amount, current_progress FROM dim_goals WHERE user_id = $1`,
      [userId]
    );
    const goals = goalsRes.rows;

    // Fetch Emotional Trigger Concentration
    const triggerRes = await query(
      `SELECT t.trigger_name, SUM(f.amount) as total
       FROM fact_transactions f
       JOIN dim_triggers t ON f.trigger_id = t.trigger_id
       WHERE f.user_id = $1 AND f.purchase_date >= NOW() - INTERVAL '30 days'
       GROUP BY t.trigger_name ORDER BY total DESC LIMIT 1`,
      [userId]
    );
    const topTrigger = triggerRes.rows[0];

    // 2. Build AI Insight for Goal Acceleration
    let goalInsight = "";
    if (goals.length > 0 && savingsImprovement > 0) {
      const primaryGoal = goals[0];
      const remaining = parseFloat(primaryGoal.target_amount) - parseFloat(primaryGoal.current_progress);
      
      // Calculate acceleration
      const oldMonthsToGoal = remaining / (lastMonthSavings > 0 ? lastMonthSavings : 1);
      const newMonthsToGoal = remaining / (currentSavings > 0 ? currentSavings : 1);
      const acceleration = oldMonthsToGoal - newMonthsToGoal;
      
      if (acceleration > 0.1) {
        goalInsight = `Based on your ${savingsImprovement.toFixed(2)} savings delta this month, your '${primaryGoal.goal_name}' is now attainable approximately ${acceleration.toFixed(1)} months faster than your previous trajectory.`;
      }
    }

    const systemPrompt = `
      You are Nova, the Senior Behavioral Financial Analyst.
      Perform a "Deep Scan" on the provided telemetry.
      Use professional terminology: 'Behavioral Velocity', 'Data Integrity', 'Goal Acceleration', 'Spending Drift'.

      Telemetry Overview:
      - Subject: ${user?.user_name || 'Subject'}
      - Current Month Spend: $${currentSpend.toFixed(2)}
      - Last Month Spend: $${lastMonthSpend.toFixed(2)}
      - Savings Delta: $${savingsImprovement.toFixed(2)}
      - Top Behavioral Catalyst: ${topTrigger ? topTrigger.trigger_name : 'No concentration detected'}
      - Goal Logic: ${goalInsight || 'Maintain current trajectory to protect goals.'}

      Goal:
      Provide a concise, high-signal behavioral report (max 4-5 sentences). 
      Specifically highlight the "Goal Acceleration" if the user is saving more. 
      Identify if the "Top Behavioral Catalyst" is causing any "Spending Drift".
      Distinguish between "Correlation" and "Causation" in their habits.
      Suggest one "Strategic Intervention".
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent(systemPrompt);
    const report = result.response.text();

    res.json({
      report,
      summary: {
        currentSpend,
        savingsImprovement,
        acceleration: goalInsight ? "Detected" : "Stable",
        topTrigger: topTrigger?.trigger_name || null
      },
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    console.error("Analysis Error:", err);
    res.status(500).json({ error: "Nova Deep Scan failed.", detail: err.message });
  }
};
