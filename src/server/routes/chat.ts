import { RequestHandler } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { query } from "../db/db.js";
import { createClaudeMessageWithRetry } from "../lib/ai.js";

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
        `SELECT user_name, baseline_spend, nova_tone, monthly_income FROM dim_users WHERE user_id = $1`,
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

    // Subscription Guard - Bypassed for now as columns do not exist in schema
    const hasActiveSub = true; 
    
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
      gentle: "Be warm, patient, and encouraging. Lead with what's going well before gently surfacing anything to watch. Use conversational, supportive language — you're a coach in their corner, not a scorekeeper.",
      balanced: "Be real with them — honest about the numbers, but always human about it. You're a sharp advisor who happens to care. Don't lecture; have a conversation.",
      driven: "Be direct, no fluff. You respect their intelligence and their goals too much to sugarcoat. Call out patterns clearly, celebrate wins briefly, and push them toward the next move."
    };

    const toneGuidance = toneInstructions[user.nova_tone?.toLowerCase() as keyof typeof toneInstructions]
      || toneInstructions.balanced;

    const incomeContext = user.monthly_income 
      ? `Monthly income: $${parseFloat(user.monthly_income).toFixed(2)} — they're currently spending ${((currentMonthSpend / parseFloat(user.monthly_income)) * 100).toFixed(1)}% of their income this month.`
      : '';

    const driftContext = drift >= 0
      ? `They're currently $${Math.abs(drift).toFixed(2)} ahead of pace to hit their monthly budget.`
      : `They're $${Math.abs(drift).toFixed(2)} under pace — well within their monthly budget.`;

    const systemPrompt = `
      You are Nova — a financial advisor who's genuinely sharp, a little direct, and actually invested in the person you're talking to.

      You're not a chatbot. You're not reciting a report. You're having a real conversation with ${user?.user_name || 'someone'} about their money — and you have their actual numbers right in front of you.

      What you know about them right now:
      - Their monthly spending target is $${monthlyBaseline.toFixed(2)}
      - They've spent $${currentMonthSpend.toFixed(2)} so far this month across ${txCount} transactions
      - Their daily average is $${currentVelocity.toFixed(2)}/day, projecting to $${projectedMonthly.toFixed(2)} this month
      - ${driftContext}
      - Top spending categories: ${topCategories || 'not enough data yet'}
      ${incomeContext}

      Coaching style: ${toneGuidance}

      How to show up in every response:
      - Talk to them like a person, not a system. Use their name naturally if it fits.
      - Reference their actual numbers in a way that feels conversational, not like a readout.
      - Only use analytical language (like "spending velocity" or "drift") if it genuinely adds value — don't pepper every sentence with it.
      - Skip the formal headers and bullet-point reports unless they ask for one.
      - Be concise. Real advisors don't over-explain.
      - Never give direct financial advice (no "you should invest in X"). Guide the thinking instead.
      - End with something useful — a question, an observation, or a nudge toward the next step.
    `;

    // 5. Engage Nova (Claude Sonnet via Anthropic)
    console.log("[Nova Chat] Engaging Nova uplink via Anthropic...");
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is missing from environment.");

    const client = new Anthropic({ apiKey });

    const trimmedHistory = (history || []).slice(-20);
    const claudeHistory = trimmedHistory
      .filter((msg: any) => msg.role === "user" || msg.role === "assistant")
      .map((msg: any) => ({
        role: msg.role as "user" | "assistant",
        content: String(msg.content || ""),
      }));

    claudeHistory.push({ role: "user", content: String(message) });

    let result;
    try {
      const MODEL = "claude-sonnet-4-6";
      console.log(`[Nova Chat] Using model: ${MODEL}`);
      result = await createClaudeMessageWithRetry(client, {
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: claudeHistory,
      });
    } catch (anthropicErr: any) {
      // Surface the real Anthropic error for diagnostics
      const status = anthropicErr?.status || 500;
      const errBody = anthropicErr?.error || anthropicErr?.message || String(anthropicErr);
      console.error(`[Nova Chat] Anthropic API Error (${status}):`, JSON.stringify(errBody));
      return res.status(502).json({
        message: "Nova Uplink Interrupted",
        detail: `Anthropic returned ${status}: ${typeof errBody === 'object' ? errBody?.error_code || errBody?.type : errBody}`,
        hint: "Verify ANTHROPIC_API_KEY is valid and has active billing on console.anthropic.com"
      });
    }

    const responseText = result.content[0].type === "text" ? result.content[0].text : "";
    if (!responseText) throw new Error("Empty response from Nova.");

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
