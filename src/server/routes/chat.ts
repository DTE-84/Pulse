import { RequestHandler } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { query } from "../db/db";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../middleware/security";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || "");

export const handleNovaChat: RequestHandler = async (req, res) => {
  const { message, history } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ message: "Authentication required." });
  if (!message) return res.status(400).json({ message: "Message is required." });

  const token = authHeader.split(" ")[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    // 1. Fetch User Context for High-Fidelity Personalization
    const userRes = await query(
      `SELECT user_name, baseline_spend, nova_tone, monthly_income FROM dim_users WHERE user_id = $1`,
      [userId]
    );
    const user = userRes.rows[0];

    // Get spending for current month
    const statsRes = await query(
      `SELECT COALESCE(SUM(amount), 0) as current_month_spend, COUNT(*) as tx_count
       FROM fact_transactions 
       WHERE user_id = $1 AND purchase_date >= DATE_TRUNC('month', CURRENT_DATE)`,
      [userId]
    );
    const currentMonthSpend = parseFloat(statsRes.rows[0].current_month_spend);
    const txCount = parseInt(statsRes.rows[0].tx_count);

    // Get Top Spending Categories (as Behavioral Triggers)
    const categoryRes = await query(
      `SELECT c.category_name, SUM(f.amount) as total, COUNT(*) as count
       FROM fact_transactions f
       JOIN dim_categories c ON f.category_id = c.category_id
       WHERE f.user_id = $1
       GROUP BY c.category_name
       ORDER BY total DESC LIMIT 3`,
      [userId]
    );
    const topCategories = categoryRes.rows.map(r => `${r.category_name} ($${parseFloat(r.total).toFixed(2)})`).join(", ");

    // Get Behavioral Segment from View
    const segmentRes = await query(
      `SELECT behavioral_segment FROM view_user_segmentation WHERE user_name = $1`,
      [user?.user_name]
    );
    const segment = segmentRes.rows[0]?.behavioral_segment || "Balanced Rhythm";

    // Calculate Velocity and Drift
    const dayOfMonth = new Date().getDate();
    const monthlyBaseline = parseFloat(user?.baseline_spend || 2500);
    const dailyBaseline = monthlyBaseline / 30;
    const currentVelocity = currentMonthSpend / dayOfMonth;
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
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      systemInstruction: systemPrompt 
    });
    
    // Map history to Gemini format (filter out system messages and map roles)
    const geminiHistory = (history || [])
      .filter((msg: any) => msg.role === "user" || msg.role === "assistant")
      .map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      }));

    const chat = model.startChat({
      history: geminiHistory,
    });
    
    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    res.json({ 
      role: "assistant", 
      content: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

  } catch (err: any) {
    console.error("Nova Chat Error:", err);
    // Fallback to flash if pro fails (e.g. quota)
    try {
      const modelFlash = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await modelFlash.generateContent(`${req.body.message} (Note: System is in limited capacity mode)`);
      const text = result.response.text();
      return res.json({ 
        role: "assistant", 
        content: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } catch (innerErr) {
      res.status(500).json({ error: "Nova is currently recalibrating.", detail: err.message });
    }
  }
};
