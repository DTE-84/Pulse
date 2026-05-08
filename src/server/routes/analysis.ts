import { RequestHandler } from "express";
import { query } from "../db/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const handleAnalysis: RequestHandler = async (req, res) => {
  console.log("[Nova Analysis] Deep Scan Initiated for User:", req.userId);

  try {
    const userId = req.userId;
    if (!userId) {
      console.error("[Nova Analysis] Error: No userId on request.");
      return res.status(401).json({ message: "Authentication required." });
    }

    // 1. Fetch User Profile
    console.log("[Nova Analysis] Querying dim_users...");
    const userRes = await query(
      `SELECT user_name, baseline_spend, monthly_income FROM dim_users WHERE user_id = $1`,
      [userId]
    );
    const user = userRes.rows[0];

    if (!user) {
      console.warn("[Nova Analysis] Subject not found in dim_users. Using fallback persona.");
    }

    // 2. Fetch Telemetry
    console.log("[Nova Analysis] Querying fact_transactions...");
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

    const currentSpend = parseFloat(currentMonthRes.rows[0]?.spend || "0");
    const lastMonthSpend = parseFloat(lastMonthRes.rows[0]?.spend || "0");
    const income = parseFloat(user?.monthly_income || "5200");
    
    const currentSavings = income - currentSpend;
    const lastMonthSavings = income - lastMonthSpend;
    const savingsImprovement = currentSavings - lastMonthSavings;

    // Fetch Active Goals
    console.log("[Nova Analysis] Querying dim_goals...");
    const goalsRes = await query(
      `SELECT goal_name, target_amount, current_progress FROM dim_goals WHERE user_id = $1`,
      [userId]
    );
    const goals = goalsRes.rows;

    // Fetch Emotional Trigger Concentration
    console.log("[Nova Analysis] Querying dim_triggers...");
    const triggerRes = await query(
      `SELECT t.trigger_name, SUM(f.amount) as total
       FROM fact_transactions f
       JOIN dim_triggers t ON f.trigger_id = t.trigger_id
       WHERE f.user_id = $1 AND f.purchase_date >= NOW() - INTERVAL '30 days'
       GROUP BY t.trigger_name ORDER BY total DESC LIMIT 1`,
      [userId]
    );
    const topTrigger = triggerRes.rows[0];

    // 3. Build AI Insight
    let goalInsight = "";
    if (goals.length > 0 && savingsImprovement > 0) {
      const primaryGoal = goals[0];
      const remaining = parseFloat(primaryGoal.target_amount) - parseFloat(primaryGoal.current_progress);
      const oldMonthsToGoal = remaining / (lastMonthSavings > 0 ? lastMonthSavings : 1);
      const newMonthsToGoal = remaining / (currentSavings > 0 ? currentSavings : 1);
      const acceleration = oldMonthsToGoal - newMonthsToGoal;
      
      if (acceleration > 0.1) {
        goalInsight = `Based on your $${savingsImprovement.toFixed(2)} savings delta, '${primaryGoal.goal_name}' is attainable ${acceleration.toFixed(1)} months faster.`;
      }
    }

    const systemPrompt = `
      You are Nova, the Senior Behavioral Analyst.
      Analyze this telemetry:
      - Subject: ${user?.user_name || 'Anonymous Subject'}
      - Monthly Income: $${income.toFixed(2)}
      - Current Spend: $${currentSpend.toFixed(2)}
      - Last Month Spend: $${lastMonthSpend.toFixed(2)}
      - Savings Improvement: $${savingsImprovement.toFixed(2)}
      - Top Catalyst: ${topTrigger ? topTrigger.trigger_name : 'Stable Rhythm'}
      - Goal Progress: ${goalInsight || 'Deterministic trajectory maintained.'}

      Requirements:
      1. Use clinical, high-fidelity terminology (Behavioral Velocity, Spending Drift).
      2. Max 4 sentences. Be impactful.
      3. Suggest one "Brain Defrag" protocol.
    `;

    console.log("[Nova Analysis] Engaging Gemini 1.5 Pro...");
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_GENAI_API_KEY is undefined in server environment.");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent(systemPrompt);
    const report = result.response.text();

    console.log("[Nova Analysis] Deep Scan Complete.");
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
    console.error("[Nova Analysis CRASH]:", err.message);
    res.status(500).json({ 
      error: "Nova Deep Scan Interrupted", 
      detail: err.message,
      hint: "Check DATABASE_URL and GOOGLE_GENAI_API_KEY on server." 
    });
  }
};
