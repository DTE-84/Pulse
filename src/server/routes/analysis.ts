import { RequestHandler } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { query } from "../db/db";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || "");

export const handleAnalysis: RequestHandler = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Authentication required." });

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
      You are Nova, the Advanced Financial AI Consultant and Senior Behavioral Analyst for the Pulse DTE Ecosystem.
      Perform a "Deep Scan" on the provided financial telemetry with absolute precision.
      Your primary goal is to maintain "Data Integrity" and provide "Signal Clarity" regarding the user's spending rhythm.

      Terminology & Style:
      - Use Senior Analyst vernacular: 'Behavioral Velocity', 'Data Integrity', 'Goal Acceleration', 'Spending Drift', 'Deterministic Architecture', 'Categorical to Ordinal'.
      - Distinguish between "Correlation" and "Causation" in behavioral patterns.
      - Maintain a clinical, sophisticated, yet deeply supportive tone.

      Telemetry Overview:
      - Subject: ${user?.user_name || 'Subject'}
      - Current Month Spend: $${currentSpend.toFixed(2)}
      - Last Month Spend: $${lastMonthSpend.toFixed(2)}
      - Savings Delta: $${savingsImprovement.toFixed(2)}
      - Top Behavioral Catalyst: ${topTrigger ? topTrigger.trigger_name : 'No concentration detected'}
      - Goal Logic: ${goalInsight || 'Maintain current deterministic trajectory to protect established goals.'}

      Report Requirements:
      1. Provide a concise, high-signal behavioral report (max 4-5 sentences). 
      2. Specifically calculate and highlight "Goal Acceleration" if the savings delta is positive. 
      3. Identify if the "Top Behavioral Catalyst" is inducing any measurable "Spending Drift".
      4. Suggest one "Strategic Intervention" or "Brain Defrag" protocol to optimize velocity.
      5. Conclude with a statement on the integrity of the current behavioral node.
    `;

    if (!process.env.GOOGLE_GENAI_API_KEY) {
      throw new Error("GOOGLE_GENAI_API_KEY is missing from environment telemetry.");
    }

    // Using Gemini 2.5 Pro for High-Fidelity Behavioral Analysis and Goal Logic
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
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
