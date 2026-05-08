import { RequestHandler } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { query } from "../db/db";

export const handleNovaChat: RequestHandler = async (req, res) => {
  const userId = req.userId;
  console.log(`[Nova Chat] Signal Received from User: ${userId}`);
  
  try {
    const { message, history } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
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

    const systemPrompt = `
      You are Nova, the Advanced Financial AI Consultant.
      Persona: Senior Systems Engineer and Behavioral Analyst. 
      Values: Data Integrity, Signal Clarity, Deterministic Architecture.

      User Telemetry:
      - Subject: ${user?.user_name || 'Anonymous Subject'}
      - Monthly Baseline: $${monthlyBaseline.toFixed(2)}
      - Current Month Spend: $${currentMonthSpend.toFixed(2)} (${txCount} nodes)
      - Spending Drift: $${drift.toFixed(2)}
      - Daily Velocity: $${currentVelocity.toFixed(2)}/day
      - Active Categories: ${topCategories || 'Establishing baseline'}

      Guidelines:
      - Use Senior Analyst terminology.
      - Never give direct financial advice.
      - Provide high-signal behavioral insights.
      - Conclude with a clinical yet supportive tone.
    `;

    // 5. Engage Gemini 1.5 Flash
    console.log("[Nova Chat] Engaging Gemini 1.5 Flash...");
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_GENAI_API_KEY is missing from environment.");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", 
      systemInstruction: systemPrompt 
    });
    
    const geminiHistory = (history || [])
      .filter((msg: any) => msg.role === "user" || msg.role === "assistant")
      .map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: String(msg.content || "") }]
      }));

    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(String(message));
    
    if (!result.response) throw new Error("Empty response from Gemini.");

    console.log("[Nova Chat] Response Dispatched.");
    return res.json({ 
      role: "assistant", 
      content: result.response.text(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

  } catch (err: any) {
    console.error("[Nova Chat CRITICAL FAILURE]:", err.message);
    return res.status(500).json({ 
      message: "Nova Uplink Interrupted", 
      detail: err.message,
      hint: "Verify Gemini API Key and DB connectivity."
    });
  }
};
