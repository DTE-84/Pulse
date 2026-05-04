import { RequestHandler } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { query } from "../db/db";

export const handleNovaChat: RequestHandler = async (req, res) => {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || "");
  console.log("[Nova Chat] Request headers:", req.headers.authorization ? "Bearer [HIDDEN]" : "MISSING");
  console.log("[Nova Chat] Request userId:", req.userId || "UNDEFINED");
  
  try {
    const { message, history } = req.body;

    const userId = req.userId;
    if (!userId) {
      console.warn("[Nova Chat] Rejected: No userId found on request.");
      return res.status(401).json({ message: "Authentication required." });
    }

    console.log(`[Nova Chat] Signal received from User: ${userId}`);

    // 1. Fetch User Context for High-Fidelity Personalization
    let user;
    try {
      const userRes = await query(
        `SELECT user_name, baseline_spend, nova_tone, monthly_income FROM dim_users WHERE user_id = $1`,
        [userId]
      );
      user = userRes.rows[0];
    } catch (dbErr: any) {
      console.error("[Nova Chat] Database error (User Context):", dbErr.message);
      throw new Error(`Telemetry Linkage Failed: ${dbErr.message}`);
    }

    // Get spending for current month
    let currentMonthSpend = 0;
    let txCount = 0;
    try {
      const statsRes = await query(
        `SELECT COALESCE(SUM(amount), 0) as current_month_spend, COUNT(*) as tx_count
         FROM fact_transactions 
         WHERE user_id = $1 AND purchase_date >= DATE_TRUNC('month', CURRENT_DATE)`,
        [userId]
      );
      currentMonthSpend = parseFloat(statsRes.rows[0].current_month_spend);
      txCount = parseInt(statsRes.rows[0].tx_count);
    } catch (dbErr: any) {
      console.error("[Nova Chat] Database error (Spending Stats):", dbErr.message);
    }

    // Get Top Spending Categories (as Behavioral Triggers)
    let topCategories = "";
    try {
      const categoryRes = await query(
        `SELECT c.category_name, SUM(f.amount) as total, COUNT(*) as count
         FROM fact_transactions f
         JOIN dim_categories c ON f.category_id = c.category_id
         WHERE f.user_id = $1
         GROUP BY c.category_name
         ORDER BY total DESC LIMIT 3`,
        [userId]
      );
      topCategories = categoryRes.rows.map(r => `${r.category_name} ($${parseFloat(r.total).toFixed(2)})`).join(", ");
    } catch (dbErr: any) {
      console.error("[Nova Chat] Database error (Top Categories):", dbErr.message);
    }

    // Get Behavioral Segment from View
    let segment = "Balanced Rhythm";
    try {
      const segmentRes = await query(
        `SELECT behavioral_segment FROM view_user_segmentation WHERE user_name = $1`,
        [user?.user_name]
      );
      segment = segmentRes.rows[0]?.behavioral_segment || "Balanced Rhythm";
    } catch (dbErr: any) {
      console.error("[Nova Chat] Database error (Segmentation View):", dbErr.message);
      // Don't throw, just use default
    }

    // Calculate Velocity and Drift
    const dayOfMonth = new Date().getDate();
    const monthlyBaseline = parseFloat(user?.baseline_spend || 2500);
    const dailyBaseline = monthlyBaseline / 30;
    const currentVelocity = currentMonthSpend / (dayOfMonth || 1);
    const drift = currentMonthSpend - (dailyBaseline * dayOfMonth);

    // 2. Build the Senior Analyst Persona Prompt
    const systemPrompt = `
      You are Nova, the Advanced Financial AI Consultant for the Pulse DTE Ecosystem.
      Your persona is a Senior Systems Engineer and Behavioral Analyst. 
      You prioritize "Data Integrity," "Signal Clarity," and "Deterministic Architecture."

      Tone & Style:
      - Clinical, professional, sophisticated, and deeply supportive.
      - Use "Senior Analyst" terminology: 'Spending Drift', 'Behavioral Velocity', 'Data Integrity', 'Categorical to Ordinal', 'Grouped Imputation', 'Correlation vs Causation'.
      - Avoid conversational filler; provide high-signal output.

      User Financial Telemetry (High-Fidelity):
      - User: ${user?.user_name || 'Subject'}
      - Behavioral Segment: ${segment}
      - Monthly Baseline: $${monthlyBaseline.toFixed(2)}
      - Current Month Spend: $${currentMonthSpend.toFixed(2)} (${txCount} transactions)
      - Spending Drift: $${drift.toFixed(2)} (vs. Linear Baseline)
      - Daily Behavioral Velocity: $${currentVelocity.toFixed(2)}/day
      - Tone Protocol: ${user?.nova_tone || 'Balanced'}
      - Primary Spending Nodes: ${topCategories || 'Insufficient data'}

      Guidelines:
      1. Analyze the telemetry for deviations. If Drift is positive, identify it as a "High-Velocity Surge."
      2. When discussing categories, consider the "Categorical to Ordinal" shift in risk levels.
      3. Distinguish between "Correlation" (e.g., spending on weekends) and "Causation" (e.g., emotional triggers) when possible.
      4. If the user is stressed, suggest a "Brain Defrag" or a "Spending Pause."
      5. Never give direct financial advice; offer analytical insights into behavioral patterns and data integrity.
      6. Keep responses concise, impactful, and professional.
    `;

    // 3. Generate AI Response with History Support
    if (!process.env.GOOGLE_GENAI_API_KEY) {
      console.error("[Nova Chat] FATAL: GOOGLE_GENAI_API_KEY is missing from environment.");
      return res.status(500).json({ error: "System Configuration Error", detail: "AI Key missing from Server Environment." });
    }

    // Using Pro for maximum reasoning accuracy and complex behavioral mapping
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro", 
      systemInstruction: systemPrompt 
    });
    
    const geminiHistory = (history || [])
      .filter((msg: any) => msg.role === "user" || msg.role === "assistant")
      .map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: String(msg.content || "") }]
      }));

    const chat = model.startChat({
      history: geminiHistory,
    });
    
    console.log(`[Nova Chat] Dispatching message to Gemini Flash for ${user?.user_name || userId}`);
    const result = await chat.sendMessage(String(message));
    
    if (!result.response) {
      throw new Error("Empty response from Gemini.");
    }

    const responseText = result.response.text();

    return res.json({ 
      role: "assistant", 
      content: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

  } catch (err: any) {
    console.error("[Nova Chat Critical Error]:", {
      message: err.message,
      status: err.status || err.response?.status,
      detail: err.response?.data || "No extra detail",
      userId: req.userId
    });
    
    return res.status(500).json({ 
      message: "Nova Uplink Interrupted", 
      detail: err.message,
      hint: "Verify GOOGLE_GENAI_API_KEY and check for Vercel timeouts."
    });
  }
};
