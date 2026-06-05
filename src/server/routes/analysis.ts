import { RequestHandler } from "express";
import { query } from "../db/db.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const handleAnalysis: RequestHandler = async (req, res) => {
  const userId = req.userId;
  console.log(`[Nova Deep Scan] Initiated for User: ${userId}`);

  try {
    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    // 1. Fetch High-Fidelity Telemetry
    console.log("[Nova Analysis] Querying dim_users...");
    let user;
    try {
      const userRes = await query(
        `SELECT user_name, baseline_spend, monthly_income, subscription_status, trial_ends_at FROM dim_users WHERE user_id = $1`,
        [userId]
      );
      user = userRes.rows[0];
    } catch (dbErr: any) {
      console.error("[Nova Analysis] DB Error (dim_users):", dbErr.message);
      return res.status(500).json({ error: "Telemetry Linkage Failed", detail: dbErr.message });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Subscription Guard
    const hasActiveSub = user.subscription_status === 'active' || 
                         (user.subscription_status === 'trialing' && new Date(user.trial_ends_at) > new Date());
    
    if (!hasActiveSub) {
      return res.status(403).json({ 
        message: "Elite Access Required", 
        detail: "Your trial has ended or subscription is inactive. Please activate Elite membership to continue." 
      });
    }

    // 2. Fetch Spending Data
    console.log("[Nova Analysis] Querying fact_transactions...");
    let currentSpend = 0;
    let lastMonthSpend = 0;
    try {
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
      currentSpend = parseFloat(currentMonthRes.rows[0]?.spend || "0");
      lastMonthSpend = parseFloat(lastMonthRes.rows[0]?.spend || "0");
    } catch (dbErr: any) {
      console.error("[Nova Analysis] DB Error (fact_transactions):", dbErr.message);
    }

    // 2.1 Validate Telemetry Availability
    if (currentSpend === 0 && lastMonthSpend === 0) {
      console.warn(`[Nova Analysis] Insufficient telemetry for User: ${userId}`);
      return res.status(400).json({ 
        message: "Insufficient telemetry for a deep scan. Please sync your transaction data to initialize high-fidelity analysis.",
        hint: "Use the 'Sync Data' node on the dashboard."
      });
    }

    const income = parseFloat(user?.monthly_income || "5200");
    const currentSavings = income - currentSpend;
    const lastMonthSavings = income - lastMonthSpend;
    const savingsImprovement = currentSavings - lastMonthSavings;

    // 3. Fetch Active Goals
    console.log("[Nova Analysis] Querying dim_goals...");
    let goals = [];
    try {
      const goalsRes = await query(
        `SELECT goal_name, target_amount, current_progress FROM dim_goals WHERE user_id = $1`,
        [userId]
      );
      goals = goalsRes.rows;
    } catch (dbErr: any) {
      console.error("[Nova Analysis] DB Error (dim_goals):", dbErr.message);
    }

    // 4. Fetch Emotional Catalyst
    console.log("[Nova Analysis] Querying dim_triggers...");
    let topTrigger;
    try {
      const triggerRes = await query(
        `SELECT t.trigger_name, SUM(f.amount) as total
         FROM fact_transactions f
         JOIN dim_triggers t ON f.trigger_id = t.trigger_id
         WHERE f.user_id = $1 AND f.purchase_date >= NOW() - INTERVAL '30 days'
         GROUP BY t.trigger_name ORDER BY total DESC LIMIT 1`,
        [userId]
      );
      topTrigger = triggerRes.rows[0];
    } catch (dbErr: any) {
      console.error("[Nova Analysis] DB Error (dim_triggers):", dbErr.message);
    }

    // 5. Build AI Insight
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
      Analyze this telemetry with precision:
      - Subject: ${user?.user_name || 'Anonymous Subject'}
      - Monthly Income: $${income.toFixed(2)}
      - Current Spend: $${currentSpend.toFixed(2)}
      - Last Month Spend: $${lastMonthSpend.toFixed(2)}
      - Savings Improvement: $${savingsImprovement.toFixed(2)}
      - Top Catalyst: ${topTrigger ? topTrigger.trigger_name : 'Stable Rhythm'}
      - Goal Logic: ${goalInsight || 'Deterministic trajectory maintained.'}

      Report Requirements:
      1. Use clinical, high-fidelity terminology (Behavioral Velocity, Spending Drift).
      2. Keep it to 4 concise sentences.
      3. Suggest one "Brain Defrag" protocol to optimize velocity.
    `;

    console.log("[Nova Analysis] Engaging Gemini 1.5 Flash...");
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    let report = "";

    if (!apiKey) {
      console.warn("[Nova Analysis] GOOGLE_GENAI_API_KEY missing. Activating Deterministic Fallback.");
      report = generateFallbackReport(user?.user_name, currentSpend, savingsImprovement, topTrigger?.trigger_name, goalInsight);
    } else {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const result = await model.generateContent(systemPrompt);
        
        if (!result || !result.response) {
          throw new Error("Empty response from Gemini.");
        }
        
        report = result.response.text();
        console.log("[Nova Analysis] Deep Scan Successful.");
      } catch (aiErr: any) {
        console.error("[Nova Analysis] AI Uplink Failed:", aiErr.message);
        report = generateFallbackReport(user?.user_name, currentSpend, savingsImprovement, topTrigger?.trigger_name, goalInsight);
      }
    }

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
    console.error("[Nova Analysis CRITICAL FAILURE]:", err.message);
    res.status(500).json({ 
      error: "Nova Uplink Interrupted", 
      detail: err.message,
      hint: "Verify DB connectivity." 
    });
  }
};

/**
 * Deterministic Fallback: Generates a structured report based on telemetry
 * when the AI service is unreachable.
 */
function generateFallbackReport(
  name: string = "Subject", 
  spend: number, 
  savings: number, 
  trigger: string | null, 
  goal: string
): string {
  const trend = savings >= 0 ? "positive" : "concerning";
  const velocity = spend > 0 ? "active" : "dormant";
  
  return `Telemetry scan for ${name} complete. Your current spending velocity is ${velocity} at $${spend.toFixed(2)}. ` +
         `We've detected a ${trend} savings delta of $${Math.abs(savings).toFixed(2)} compared to last month. ` +
         `${trigger ? `Primary catalyst identified: ${trigger}.` : "Behavioral rhythm remains stable."} ` +
         `${goal || "No immediate goal drift detected."} Protocol: Initiate 'Brain Defrag' to optimize monthly trajectory.`;
}
