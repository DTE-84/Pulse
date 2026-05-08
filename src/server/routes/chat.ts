import { RequestHandler } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { query } from "../db/db";

export const handleNovaChat: RequestHandler = async (req, res) => {
  console.log("[Nova Chat] Uplink Signal for User:", req.userId);

  try {
    const { message, history } = req.body;
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Authentication required." });

    // 1. Fetch High-Fidelity Telemetry
    console.log("[Nova Chat] Fetching telemetry nodes...");
    const userRes = await query(
      `SELECT user_name, baseline_spend, nova_tone, monthly_income FROM dim_users WHERE user_id = $1`,
      [userId]
    );
    const user = userRes.rows[0];

    // Current month spend
    const statsRes = await query(
      `SELECT COALESCE(SUM(amount), 0) as current_month_spend, COUNT(*) as tx_count
       FROM fact_transactions 
       WHERE user_id = $1 AND purchase_date >= DATE_TRUNC('month', CURRENT_DATE)`,
      [userId]
    );
    const currentMonthSpend = parseFloat(statsRes.rows[0]?.current_month_spend || "0");
    const txCount = parseInt(statsRes.rows[0]?.tx_count || "0");

    // Top categories
    const categoryRes = await query(
      `SELECT c.category_name, SUM(f.amount) as total
       FROM fact_transactions f
       JOIN dim_categories c ON f.category_id = c.category_id
       WHERE f.user_id = $1
       GROUP BY c.category_name
       ORDER BY total DESC LIMIT 3`,
      [userId]
    );
    const topCategories = categoryRes.rows.map((r: any) => `${r.category_name} ($${parseFloat(r.total).toFixed(2)})`).join(", ");

    // Behavioral metrics
    const dayOfMonth = new Date().getDate();
    const monthlyBaseline = parseFloat(user?.baseline_spend || "2500");
    const currentVelocity = currentMonthSpend / (dayOfMonth || 1);
    const drift = currentMonthSpend - ((monthlyBaseline / 30) * dayOfMonth);

    const systemPrompt = `
      You are Nova, the Advanced Financial AI Consultant.
      User Telemetry:
      - Subject: ${user?.user_name || 'Subject'}
      - Monthly Baseline: $${monthlyBaseline.toFixed(2)}
      - Current Spend: $${currentMonthSpend.toFixed(2)} (${txCount} nodes)
      - Spending Drift: $${drift.toFixed(2)}
      - Daily Velocity: $${currentVelocity.toFixed(2)}/day
      - Active Segments: ${topCategories || 'Establishing baseline'}

      Guidelines:
      - Use "Senior Analyst" terminology (Signal Clarity, Behavioral Velocity).
      - Maintain absolute Data Integrity.
      - Provide high-signal, clinical insights.
    `;

    // 2. Engage Gemini
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_GENAI_API_KEY is missing on server.");

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
    console.log("[Nova Chat] Dispatching to Gemini 1.5 Flash...");
    const result = await chat.sendMessage(String(message));
    
    if (!result.response) throw new Error("Empty response from AI uplink.");

    return res.json({ 
      role: "assistant", 
      content: result.response.text(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

  } catch (err: any) {
    console.error("[Nova Chat CRASH]:", err.message);
    return res.status(500).json({ 
      message: "Nova Uplink Interrupted", 
      detail: err.message,
      hint: "Verify DATABASE_URL and GOOGLE_GENAI_API_KEY on Vercel."
    });
  }
};
