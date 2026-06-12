import { RequestHandler } from "express";
import Anthropic from "@anthropic-ai/sdk";

import { query } from "../db/db.js";

export const handleNovaChat: RequestHandler = async (req, res) => {
  const userId = req.userId;
  console.log(`[Nova Chat] Signal Received from User: ${userId}`);
  
  try {
    const { message, history } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    // Input Validation
    if (!message || typeof message !== "string") {
      return res.status(400).json({ message: "Invalid payload: message is required and must be a string." });
    }
    if (history && !Array.isArray(history)) {
      return res.status(400).json({ message: "Invalid payload: history must be an array." });
    }
    if (message.length > 2000) {
      return res.status(400).json({ message: "Message exceeds 2000 character limit." });
    }

    // 1. Fetch User Context
    console.log("[Nova Chat] Querying user telemetry...");
    let user;
    try {
      const userRes = await query(
        `SELECT user_name, baseline_spend, nova_tone, monthly_income, subscription_status, trial_ends_at FROM dim_users WHERE user_id = $1`,
        [userId]
      );
      user = userRes.rows[0];
    } catch (dbErr: any) {
      console.error("[Nova Chat] DB Error (User Context):", dbErr.message);
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

    // 2. Fetch Spending Stats
    console.log("[Nova Chat] Querying spending nodes...");
    let currentMonthSpend = 0;
    let txCount = 0;
    try {
      const statsRes = await query(
        `SELECT COALESCE(SUM(amount), 0) as current_month_spend, COUNT(*) as tx_count
         FROM fact_transactions 
         WHERE user_id = $1 AND purchase_date >= DATE_TRUNC('month', CURRENT_DATE)`,
        [userId]
      );
      currentMonthSpend = parseFloat(statsRes.rows[0]?.current_month_spend || "0");
      txCount = parseInt(statsRes.rows[0]?.tx_count || "0");
    } catch (dbErr: any) {
      console.error("[Nova Chat] DB Error (Spending Stats):", dbErr.message);
    }

    // 3. Fetch Top Categories
    let topCategories = "";
    try {
      const categoryRes = await query(
        `SELECT c.category_name, SUM(f.amount) as total
         FROM fact_transactions f
         JOIN dim_categories c ON f.category_id = c.category_id
         WHERE f.user_id = $1
         GROUP BY c.category_name
         ORDER BY total DESC LIMIT 3`,
        [userId]
      );
      topCategories = categoryRes.rows.map((r: any) => `${r.category_name} ($${parseFloat(r.total).toFixed(2)})`).join(", ");
    } catch (dbErr: any) {
      console.error("[Nova Chat] DB Error (Top Categories):", dbErr.message);
    }

    // 4. Calculate Metrics
    const dayOfMonth = new Date().getDate();
    const monthlyBaseline = parseFloat(user?.baseline_spend || "2500");
    const dailyBaseline = monthlyBaseline / 30;
    const currentVelocity = currentMonthSpend / (dayOfMonth || 1);
    const drift = currentMonthSpend - (dailyBaseline * dayOfMonth);
    const projectedMonthly = currentVelocity * 30;

    const toneInstructions = {
      gentle: "Use calm, encouraging language. Soften clinical terms with warmth. Lead with positive signals before addressing drift.",
      balanced: "Maintain clarity and consistency. Clinical but approachable. Balance data with human context.",
      driven: "Push with stronger accountability. Be direct and challenge complacency. Name patterns that need correction."
    };

    const toneGuidance = toneInstructions[user.nova_tone?.toLowerCase() as keyof typeof toneInstructions]
      || toneInstructions.balanced;

    const incomeContext = user.monthly_income 
      ? `- Monthly Income: $${parseFloat(user.monthly_income).toFixed(2)}\n  - Spend-to-Income Ratio: ${((currentMonthSpend / parseFloat(user.monthly_income)) * 100).toFixed(1)}%`
      : '';

    const systemPrompt = `
      You are Nova, the Advanced Financial AI Consultant.
      Persona: Senior Systems Engineer and Behavioral Analyst.
      Values: Data Integrity, Signal Clarity, Deterministic Architecture.

      User Telemetry:
      - Subject: ${user?.user_name || 'Anonymous Subject'}
      - Monthly Baseline: $${monthlyBaseline.toFixed(2)}
      - Current Month Spend: $${currentMonthSpend.toFixed(2)} (${txCount} nodes)
      - Projected Monthly Total: $${projectedMonthly.toFixed(2)}
      - Spending Drift: $${drift.toFixed(2)} (${drift >= 0 ? 'Over' : 'Under'} baseline pace)
      - Daily Velocity: $${currentVelocity.toFixed(2)}/day
      - Active Categories: ${topCategories || 'Establishing baseline'}
      ${incomeContext}

      Coaching Tone: ${toneGuidance}

      Guidelines:
      - Use Senior Analyst terminology (e.g., "Signal Deviation", "Mass Trajectory", "Behavioral Velocity").
      - Never give direct financial advice.
      - Provide high-signal behavioral insights tied to the user's actual telemetry.
      - Honor the coaching tone in every response — it was chosen by the user.
      - Conclude with a clinical yet supportive observation.
    `;

    // 5. Engage Claude Sonnet
    console.log("[Nova Chat] Engaging Claude Sonnet...");
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is missing from environment.");

    const client = new Anthropic({ apiKey });

    // Manage context and cost: Keep last 20 messages (10 exchanges)
    const trimmedHistory = (history || []).slice(-20);

    const claudeHistory = trimmedHistory
      .filter((msg: any) => msg.role === "user" || msg.role === "assistant")
      .map((msg: any) => ({
        role: msg.role as "user" | "assistant",
        content: String(msg.content || ""),
      }));

    claudeHistory.push({ role: "user", content: String(message) });

    const result = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: claudeHistory,
    });

    const responseText = result.content[0].type === "text" ? result.content[0].text : "";
    if (!responseText) throw new Error("Empty response from Claude.");

    console.log("[Nova Chat] Response Dispatched.");
    return res.json({
      role: "assistant",
      content: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

  } catch (err: any) {
    const isProd = process.env.NODE_ENV === "production";
    console.error("[Nova Chat CRITICAL FAILURE]:", err.message);
    return res.status(500).json({ 
      message: "Nova Uplink Interrupted", 
      detail: isProd ? "The analytical link could not be established." : err.message,
      hint: isProd ? undefined : "Verify Anthropic API Key and DB connectivity."
    });
  }
};
