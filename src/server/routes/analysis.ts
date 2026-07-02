import { RequestHandler } from "express";
import { query } from "../db/db.js";
import Anthropic from "@anthropic-ai/sdk";

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
        `SELECT user_name, baseline_spend, monthly_income, nova_tone, subscription_status, trial_ends_at FROM dim_users WHERE user_id = $1`,
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
        message: "Not enough spending data yet. Add a few transactions first and then run the deep scan.",
        hint: "Use the 'Sync Data' option on the dashboard."
      });
    }

    const income = parseFloat(user?.monthly_income || "0");
    const hasIncome = income > 0;
    let savingsImprovement = 0;

    if (hasIncome) {
      const currentSavings = income - currentSpend;
      const lastMonthSavings = income - lastMonthSpend;
      savingsImprovement = currentSavings - lastMonthSavings;
    }

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
    if (hasIncome && goals.length > 0 && savingsImprovement > 0) {
      const primaryGoal = goals[0];
      const remaining = parseFloat(primaryGoal.target_amount) - parseFloat(primaryGoal.current_progress);
      const lastMonthSavings = income - lastMonthSpend;
      const currentSavings = income - currentSpend;
      const oldMonthsToGoal = remaining / (lastMonthSavings > 0 ? lastMonthSavings : 1);
      const newMonthsToGoal = remaining / (currentSavings > 0 ? currentSavings : 1);
      const acceleration = oldMonthsToGoal - newMonthsToGoal;
      
      if (acceleration > 0.1) {
        goalInsight = `Based on your $${savingsImprovement.toFixed(2)} savings delta, '${primaryGoal.goal_name}' is attainable ${acceleration.toFixed(1)} months faster.`;
      }
    }

    // 5.1 Personality & Tone Logic
    const toneInstructions = {
      gentle: "Be warm, patient, and encouraging. Lead with what's going well before gently surfacing anything to watch. Use conversational, supportive language — you're a coach in their corner, not a scorekeeper.",
      balanced: "Be real with them — honest about the numbers, but always human about it. You're a sharp advisor who happens to care. Don't lecture; have a conversation.",
      driven: "Be direct, no fluff. You respect their intelligence and their goals too much to sugarcoat. Call out patterns clearly, celebrate wins briefly, and push them toward the next move."
    };

    const toneGuidance = toneInstructions[(user.nova_tone as string || "balanced").toLowerCase() as keyof typeof toneInstructions]
      || toneInstructions.balanced;

    const systemPrompt = `
      You are Nova — a financial advisor who's sharp, human, and genuinely invested in the people you work with.

      You're doing a monthly check-in for ${user?.user_name || 'this person'}. You have their real numbers. Use them naturally — like you'd speak them in a room, not paste them in a report.

      Here's what you're working with:
      - Income: ${hasIncome ? `$${income.toFixed(2)}/month` : "not on file"}
      - Spent this month: $${currentSpend.toFixed(2)}
      - Spent last month: $${lastMonthSpend.toFixed(2)}
      - Savings movement: ${hasIncome ? `$${savingsImprovement.toFixed(2)} ${savingsImprovement >= 0 ? 'improvement' : 'decline'} vs last month` : 'income not on file'}
      - Biggest emotional spending driver: ${topTrigger ? topTrigger.trigger_name : 'nothing significant flagged'}
      - Goal momentum: ${goalInsight || 'goals are on a steady trajectory'}

      Coaching style: ${toneGuidance}

      Write a concise check-in — 4 sentences max. Sound like yourself. Don't use headers or bullet points. Reference the actual numbers conversationally. Close with one concrete thing they can do this week to keep the momentum going or course-correct — call it a "Brain Defrag" moment.
    `;

    console.log("[Nova Analysis] Engaging Claude Sonnet...");
    const apiKey = process.env.ANTHROPIC_API_KEY;
    let report = "";

    if (!apiKey) {
      console.warn("[Nova Analysis] ANTHROPIC_API_KEY missing. Activating Deterministic Fallback.");
      report = generateFallbackReport(user?.user_name, currentSpend, savingsImprovement, topTrigger?.trigger_name, goalInsight);
    } else {
      try {
        const client = new Anthropic({ apiKey });
        const response = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: "Hey Nova, let's do my monthly check-in." }]
        });

        report = response.content[0].type === "text" ? response.content[0].text : "";
        if (!report) throw new Error("Empty response from Claude.");
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
        savingsImprovement: hasIncome ? savingsImprovement : null,
        acceleration: goalInsight ? "Detected" : "Stable",
        topTrigger: topTrigger?.trigger_name || null
      },
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    const isProd = process.env.NODE_ENV === "production";
    console.error("[Nova Analysis CRITICAL FAILURE]:", err.message);
    res.status(500).json({ 
      error: "Nova Uplink Interrupted", 
      detail: isProd ? "Deep scan unavailable." : err.message,
      hint: "Verify DB connectivity." 
    });
  }
};

/**
 * Deterministic Fallback: Generates a structured report based on telemetry
 * when the AI service is unreachable.
 */
function generateFallbackReport(
  name: string = "you", 
  spend: number, 
  savings: number, 
  trigger: string | null, 
  goal: string
): string {
  const trend = savings >= 0 ? "in the right direction" : "something worth addressing";
  const triggerNote = trigger 
    ? `Your biggest spending driver this month has been ${trigger} — worth being mindful of that pattern.`
    : "No major spending triggers flagged this period, which is a good sign.";
  
  return `Here's where things stand, ${name}: you've spent $${spend.toFixed(2)} this month, and the trend is ${trend} — ` +
         `${savings >= 0 ? `you're $${Math.abs(savings).toFixed(2)} ahead of where you were last month` : `you're $${Math.abs(savings).toFixed(2)} behind last month's pace`}. ` +
         `${triggerNote} ` +
         `${goal || "Your goals are on track."} Brain Defrag for this week: take 10 minutes to review last week's spending and identify one category you can pull back on — small adjustments compound fast.`;
}
