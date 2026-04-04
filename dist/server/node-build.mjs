import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import { createRequire } from "module";
import pg from "pg";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import fs from "fs";
import { spawn } from "child_process";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as express$1 from "express";
const handleDemo = (req, res) => {
  const response = {
    message: "Hello from Express server"
  };
  res.status(200).json(response);
};
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true }
});
const query = (text, params) => pool.query(text, params);
const _secret = process.env.JWT_SECRET;
if (!_secret) {
  console.error("[PULSE SECURITY] FATAL: JWT_SECRET not set. Exiting.");
  process.exit(1);
}
const minLen = 32;
if (_secret.length < minLen) {
  console.error(`[PULSE SECURITY] FATAL: JWT_SECRET too short (min ${minLen} chars for ${"prod"}).`);
  process.exit(1);
}
const JWT_SECRET = _secret;
const requireAuth = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authentication required." });
    return;
  }
  try {
    const d = jwt.verify(h.split(" ")[1], JWT_SECRET);
    req.userId = d.id;
    req.userEmail = d.email;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired session." });
  }
};
const rlStore = /* @__PURE__ */ new Map();
setInterval(() => {
  const n = Date.now();
  rlStore.forEach((e, k) => {
    if (n > e.resetAt) rlStore.delete(k);
  });
}, 6e5);
function createRateLimiter(o) {
  return (req, res, next) => {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "?";
    const key = req.path + ":" + ip, now = Date.now(), e = rlStore.get(key);
    if (!e || now > e.resetAt) {
      rlStore.set(key, { count: 1, resetAt: now + o.windowMs });
      return next();
    }
    if (e.count >= o.max) {
      const s = Math.ceil((e.resetAt - now) / 1e3);
      res.setHeader("Retry-After", s);
      res.status(429).json({ message: o.message || "Too many requests.", retryAfterSeconds: s });
      return;
    }
    e.count++;
    next();
  };
}
const authLimiter = createRateLimiter({ windowMs: 9e5, max: 10, message: "Too many auth attempts. Wait 15 min." });
const ingestLimiter = createRateLimiter({ windowMs: 6e4, max: 30, message: "Ingest rate limit reached." });
const apiLimiter = createRateLimiter({ windowMs: 6e4, max: 120, message: "API rate limit reached." });
function sanitizeCsvField(v) {
  if (v === null || v === void 0) return "";
  return String(v).replace(/[\r\n]+/g, " ").replace(/,/g, "").replace(/"/g, "'").replace(/`/g, "").trim().slice(0, 255);
}
const VALID_RISK = ["Essential", "Lifestyle", "Impulse", "Critical"];
function validateTransaction(t) {
  if (typeof t !== "object" || t === null) return "Transaction must be an object.";
  const tx = t;
  if (typeof tx.date !== "string" || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(tx.date)) return "date must be YYYY-MM-DD.";
  const amt = Number(tx.amount);
  if (isNaN(amt) || amt <= 0 || amt > 1e6) return "amount must be positive and not exceed 1,000,000.";
  if (typeof tx.category !== "string" || !tx.category.trim()) return "category must be a non-empty string.";
  if (tx.risk_category !== void 0 && !VALID_RISK.includes(tx.risk_category))
    return "risk_category must be: Essential, Lifestyle, Impulse, or Critical.";
  return null;
}
const securityHeaders = (_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.removeHeader("X-Powered-By");
  next();
};
const buildNovaMessage = ({
  mode,
  currentMonthSpend,
  baseline,
  predictedBalance,
  goalLabel
}) => {
  const delta = currentMonthSpend - baseline;
  const over = delta > 0;
  const diff = Math.abs(delta).toFixed(2);
  const normalizedMode = mode.toLowerCase();
  if (!over) {
    if (normalizedMode === "gentle") {
      return `You’re spending below your usual baseline this month, and that’s giving your ${goalLabel} more room to breathe. Keep stacking small wins like this.`;
    }
    if (normalizedMode === "driven") {
      return `You’re under baseline this month. Keep pressing this advantage and turn today’s discipline into faster progress toward your ${goalLabel}.`;
    }
    return `Your spending is staying under baseline this month. If you keep this pace, you give your ${goalLabel} more room to move forward.`;
  }
  if (normalizedMode === "gentle") {
    return `You’re currently $${diff} above your monthly baseline. This isn’t failure — it’s a signal. A few calmer decisions now can protect your progress toward ${goalLabel}.`;
  }
  if (normalizedMode === "driven") {
    return `You’re $${diff} above baseline right now. Catch the drift early, tighten the next few decisions, and get your ${goalLabel} back in range.`;
  }
  return `You’re currently $${diff} above your monthly baseline. It’s worth tightening up now so your ${goalLabel} doesn’t keep slipping further out.`;
};
const handleStats = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authentication required." });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;
    const userRes = await query(
      `
      SELECT 
        baseline_spend, 
        nova_tone,
        COALESCE(monthly_income, 5200.00) as monthly_income,
        COALESCE(initial_balance, 15000.00) as initial_balance
      FROM dim_users 
      WHERE user_id = $1
    `,
      [userId]
    );
    const user = userRes.rows[0];
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const lifetimeRes = await query(
      `
      SELECT COALESCE(SUM(amount), 0) as lifetime_spend
      FROM fact_transactions
      WHERE user_id = $1
    `,
      [userId]
    );
    const lifetimeSpend = parseFloat(lifetimeRes.rows[0].lifetime_spend);
    const now = /* @__PURE__ */ new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const statsRes = await query(
      `
      SELECT 
        COALESCE(SUM(amount), 0) as current_month_spend,
        COUNT(*) as transaction_count
      FROM fact_transactions
      WHERE user_id = $1 AND purchase_date >= $2
    `,
      [userId, monthStart]
    );
    const currentMonthSpend = parseFloat(statsRes.rows[0].current_month_spend);
    const chartRes = await query(
      `
      SELECT 
        TO_CHAR(purchase_date, 'DY') as day,
        SUM(amount) as value
      FROM fact_transactions
      WHERE user_id = $1 AND purchase_date >= NOW() - INTERVAL '7 days'
      GROUP BY TO_CHAR(purchase_date, 'DY'), EXTRACT(DOW FROM purchase_date)
      ORDER BY EXTRACT(DOW FROM purchase_date)
    `,
      [userId]
    );
    const chartData = chartRes.rows.map((row) => ({
      day: row.day.charAt(0).toUpperCase(),
      value: parseFloat(row.value)
    }));
    const totalBalance = parseFloat(user.initial_balance) - lifetimeSpend;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const daysRemaining = daysInMonth - dayOfMonth;
    const dailyVelocity = currentMonthSpend / (dayOfMonth || 1);
    const projectedAdditionalSpend = dailyVelocity * daysRemaining;
    const predictedEndOfMonthSpend = currentMonthSpend + projectedAdditionalSpend;
    const predictedBalance = totalBalance - projectedAdditionalSpend;
    const baseline = parseFloat(user.baseline_spend || 2500);
    const dailyBaseline = baseline / 30;
    const spendingDrift = currentMonthSpend - dailyBaseline * dayOfMonth;
    const spendingDeltaPct = baseline > 0 ? (currentMonthSpend - baseline) / baseline * 100 : 0;
    const projection = {
      velocity: Number(dailyVelocity.toFixed(2)),
      projectedSpend: Number(predictedEndOfMonthSpend.toFixed(2)),
      drift: Number(spendingDrift.toFixed(2)),
      isHighVelocity: dailyVelocity > dailyBaseline * 1.2
    };
    const triggers = [];
    if (currentMonthSpend > baseline) {
      triggers.push({
        id: 1,
        name: "Baseline drift",
        impact: monthlyDiff.toFixed(2),
        status: monthlyDiff > baseline * 0.15 ? "High" : "Watch",
        insight: "Your spending is running above the monthly baseline you set for yourself."
      });
    }
    if (dailyVelocity > dailyBaseline * 1.5) {
      triggers.push({
        id: 2,
        name: "High spending pace",
        impact: dailyVelocity.toFixed(2),
        status: "Active",
        insight: "Your daily spending pace is noticeably above your usual rhythm this month."
      });
    }
    if (triggers.length === 0) {
      triggers.push({
        id: 0,
        name: "Steady rhythm",
        impact: "0.00",
        status: "Stable",
        insight: "Your spending is staying close to plan right now."
      });
    }
    const goalLabel = "top goal";
    const novaInsight = buildNovaMessage({
      mode: user.nova_tone || "Balanced",
      currentMonthSpend,
      baseline,
      predictedBalance,
      goalLabel
    });
    res.json({
      totalBalance: Number(totalBalance.toFixed(2)),
      monthlyIncome: parseFloat(user.monthly_income),
      monthlyExpenses: currentMonthSpend,
      predictedEndOfMonthBalance: Math.max(0, Number(predictedBalance.toFixed(2))),
      baselineSpend: baseline,
      monthlyDiff: Number(spendingDrift.toFixed(2)),
      spendingDeltaPct: Number(spendingDeltaPct.toFixed(1)),
      transactionCount: Number(statsRes.rows[0].transaction_count),
      novaTone: user.nova_tone || "Balanced",
      novaInsight,
      triggers,
      projection,
      chartData: chartData.length > 0 ? chartData : [
        { day: "M", value: 0 },
        { day: "T", value: 0 },
        { day: "W", value: 0 },
        { day: "T", value: 0 },
        { day: "F", value: 0 },
        { day: "S", value: 0 },
        { day: "S", value: 0 }
      ]
    });
  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ error: "Could not calculate dashboard statistics." });
  }
};
function validateAuthInput(email, password) {
  if (typeof email !== "string" || !email.includes("@") || email.length > 254)
    return "A valid email address is required.";
  if (typeof password !== "string" || password.length < 8)
    return "Password must be at least 8 characters.";
  return null;
}
const handleMe = async (req, res) => {
  try {
    const result = await query(
      "SELECT user_id, user_name, email, baseline_spend, nova_tone FROM dim_users WHERE user_id = ",
      [req.userId]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({
      id: user.user_id,
      email: user.email,
      name: user.user_name,
      baselineSpend: user.baseline_spend,
      novaTone: user.nova_tone,
      onboardingCompleted: true
    });
  } catch {
    res.status(500).json({ message: "Internal error." });
  }
};
const handleLogin = async (req, res) => {
  const { email, password } = req.body;
  const err = validateAuthInput(email, password);
  if (err) return res.status(400).json({ message: err });
  try {
    const result = await query(
      "SELECT user_id, user_name, email, password, baseline_spend, nova_tone FROM dim_users WHERE email = ",
      [email.toLowerCase().trim()]
    );
    const user = result.rows[0];
    const hash = user?.password || "b0";
    const match = await bcrypt.compare(password, hash);
    if (!user || !match) return res.status(401).json({ message: "Invalid credentials." });
    const token = jwt.sign({ id: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: {
      id: user.user_id,
      email: user.email,
      name: user.user_name,
      baselineSpend: user.baseline_spend,
      novaTone: user.nova_tone,
      onboardingCompleted: true
    } });
  } catch (e) {
    if (e.code === "ECONNREFUSED") return res.status(503).json({ message: "Database unavailable." });
    res.status(500).json({ message: "Authentication error." });
  }
};
const handleSignup = async (req, res) => {
  const { email, password, name } = req.body;
  const err = validateAuthInput(email, password);
  if (err) return res.status(400).json({ message: err });
  if (typeof name !== "string" || name.trim().length < 1)
    return res.status(400).json({ message: "Name is required." });
  try {
    const existing = await query("SELECT 1 FROM dim_users WHERE email = ", [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) return res.status(400).json({ message: "An account with that email already exists." });
    const hashed = await bcrypt.hash(password, 12);
    const result = await query(
      "INSERT INTO dim_users (user_name, email, password) VALUES (, , ) RETURNING user_id, user_name, email",
      [name.trim().slice(0, 100), email.toLowerCase().trim(), hashed]
    );
    const u = result.rows[0];
    const token = jwt.sign({ id: u.user_id, email: u.email }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: u.user_id, email: u.email, name: u.user_name, onboardingCompleted: false } });
  } catch (e) {
    if (e.code === "ECONNREFUSED") return res.status(503).json({ message: "Database unavailable." });
    res.status(500).json({ message: "Signup error." });
  }
};
const handleUpdateProfile = async (req, res) => {
  const { name, baselineSpend, novaTone } = req.body;
  const VALID_TONES = ["Gentle", "Balanced", "Driven"];
  if (novaTone && !VALID_TONES.includes(novaTone))
    return res.status(400).json({ message: "novaTone must be Gentle, Balanced, or Driven." });
  try {
    const result = await query(
      "UPDATE dim_users SET user_name = COALESCE(, user_name), baseline_spend = COALESCE(, baseline_spend), nova_tone = COALESCE(, nova_tone) WHERE user_id =  RETURNING user_id, user_name, email, baseline_spend, nova_tone",
      [name?.trim().slice(0, 100) || null, baselineSpend || null, novaTone || null, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "User not found." });
    res.json({ message: "Profile updated.", user: result.rows[0] });
  } catch {
    res.status(500).json({ message: "Update error." });
  }
};
const __filename$2 = fileURLToPath(import.meta.url);
const __dirname$2 = path.dirname(__filename$2);
const MAX_TRANSACTIONS = 500;
const genAI$2 = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || "");
const handleIngest = async (req, res) => {
  const { transactions } = req.body;
  const userId = req.userId;
  if (!Array.isArray(transactions) || transactions.length === 0)
    return res.status(400).json({ error: "transactions must be a non-empty array." });
  if (transactions.length > MAX_TRANSACTIONS)
    return res.status(400).json({ error: `Payload exceeds maximum of ${MAX_TRANSACTIONS} transactions.` });
  let enrichedTransactions = transactions;
  try {
    const model = genAI$2.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are Nova's Behavioral Data Wrangler. 
      Analyze the following transactions and ensure they have a 'category' and 'risk_category'.
      
      Categories: Dining, Groceries, Transport, Entertainment, Utilities, Rent, Shopping, Healthcare, Misc.
      Risk Levels (Categorical to Ordinal): Essential, Lifestyle, Impulse, Critical.
      
      Return ONLY a valid JSON array of objects with the fields: date, amount, category, risk_category.
      Keep existing data if it's already accurate.
      
      Transactions: ${JSON.stringify(transactions)}
    `;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) {
      enrichedTransactions = JSON.parse(jsonMatch[0]);
    }
  } catch (aiErr) {
    console.warn("[!] Nova AI Categorization bypassed due to error:", aiErr);
  }
  for (let i = 0; i < enrichedTransactions.length; i++) {
    const err = validateTransaction(enrichedTransactions[i]);
    if (err) return res.status(400).json({ error: `Transaction ${i} validation failed: ${err}` });
  }
  const headers = "date,amount,category,risk_category,trigger_id";
  const rows = enrichedTransactions.map((t) => [
    sanitizeCsvField(t.date),
    sanitizeCsvField(t.amount),
    sanitizeCsvField(t.category || "Misc"),
    sanitizeCsvField(t.risk_category || "Lifestyle"),
    sanitizeCsvField(t.trigger_id || "")
  ].join(",")).join("\n");
  const tempCsvPath = path.resolve(__dirname$2, "../db/transactions_temp.csv");
  const scriptPath = path.resolve(__dirname$2, "../scripts/wrangler.py");
  try {
    fs.writeFileSync(tempCsvPath, headers + "\n" + rows, { mode: 384 });
    await new Promise((resolve, reject) => {
      const proc = spawn("python", [scriptPath, tempCsvPath], { stdio: ["ignore", "pipe", "pipe"] });
      let stderr = "";
      proc.stderr.on("data", (d) => {
        stderr += d.toString();
      });
      proc.on("close", (code) => {
        if (code !== 0) reject(new Error(stderr || "Wrangler exited with code " + code));
        else resolve();
      });
      proc.on("error", reject);
    });
    const processedCsvPath = path.resolve(__dirname$2, "../db/pulse_ingest.csv");
    if (!fs.existsSync(processedCsvPath))
      return res.status(500).json({ error: "Wrangler did not produce output file." });
    const lines = fs.readFileSync(processedCsvPath, "utf-8").split("\n").slice(1).filter((l) => l.trim());
    let inserted = 0;
    for (const line of lines) {
      const parts = line.split(",");
      if (parts.length < 5) continue;
      const [date, amount, category, risk_category, trigger_id] = parts;
      let catResult = await query("SELECT category_id FROM dim_categories WHERE category_name = $1", [category]);
      let categoryId;
      if (catResult.rows.length === 0) {
        const newCat = await query(
          "INSERT INTO dim_categories (category_name, risk_level) VALUES ($1, $2) RETURNING category_id",
          [category, risk_category || "Medium"]
        );
        categoryId = newCat.rows[0].category_id;
      } else {
        categoryId = catResult.rows[0].category_id;
      }
      const tid = trigger_id && trigger_id.trim() !== "" ? parseInt(trigger_id) : null;
      await query(
        "INSERT INTO fact_transactions (user_id, category_id, amount, purchase_date, status, trigger_id) VALUES ($1, $2, $3, $4, $5, $6)",
        [userId, categoryId, parseFloat(amount), date, "Completed", tid]
      );
      inserted++;
    }
    try {
      fs.unlinkSync(tempCsvPath);
    } catch {
    }
    try {
      fs.unlinkSync(processedCsvPath);
    } catch {
    }
    res.json({ status: "Synchronized", inserted, message: `High-fidelity ingestion of ${inserted} nodes complete.` });
  } catch (err) {
    console.error("Ingest Error:", err.message);
    res.status(500).json({ error: "Ingest pipeline failed.", detail: err.message });
  }
};
const genAI$1 = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || "");
const handleNovaChat = async (req, res) => {
  const { message, history } = req.body;
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authentication required." });
  if (!message) return res.status(400).json({ message: "Message is required." });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;
    const userRes = await query(
      `SELECT user_name, baseline_spend, nova_tone, monthly_income FROM dim_users WHERE user_id = $1`,
      [userId]
    );
    const user = userRes.rows[0];
    const statsRes = await query(
      `SELECT COALESCE(SUM(amount), 0) as current_month_spend, COUNT(*) as tx_count
       FROM fact_transactions 
       WHERE user_id = $1 AND purchase_date >= DATE_TRUNC('month', CURRENT_DATE)`,
      [userId]
    );
    const currentMonthSpend = parseFloat(statsRes.rows[0].current_month_spend);
    const txCount = parseInt(statsRes.rows[0].tx_count);
    const categoryRes = await query(
      `SELECT c.category_name, SUM(f.amount) as total, COUNT(*) as count
       FROM fact_transactions f
       JOIN dim_categories c ON f.category_id = c.category_id
       WHERE f.user_id = $1
       GROUP BY c.category_name
       ORDER BY total DESC LIMIT 3`,
      [userId]
    );
    const topCategories = categoryRes.rows.map((r) => `${r.category_name} ($${parseFloat(r.total).toFixed(2)})`).join(", ");
    const segmentRes = await query(
      `SELECT behavioral_segment FROM view_user_segmentation WHERE user_name = $1`,
      [user?.user_name]
    );
    const segment = segmentRes.rows[0]?.behavioral_segment || "Balanced Rhythm";
    const dayOfMonth = (/* @__PURE__ */ new Date()).getDate();
    const monthlyBaseline = parseFloat(user?.baseline_spend || 2500);
    const dailyBaseline = monthlyBaseline / 30;
    const currentVelocity = currentMonthSpend / dayOfMonth;
    const drift = currentMonthSpend - dailyBaseline * dayOfMonth;
    const systemPrompt = `
      You are Nova, the Advanced Financial AI Consultant for the Pulse DTE Ecosystem.
      Your persona is a Senior Systems Engineer and Behavioral Analyst. 
      You prioritize "Data Integrity," "Signal Clarity," and "Deterministic Architecture."

      Tone & Style:
      - Clinical, professional, sophisticated, and deeply supportive.
      - Use "Senior Analyst" terminology: 'Spending Drift', 'Behavioral Velocity', 'Data Integrity', 'Categorical to Ordinal', 'Grouped Imputation', 'Correlation vs Causation'.
      - Avoid conversational filler; provide high-signal output.

      User Financial Telemetry (High-Fidelity):
      - User: ${user?.user_name || "Subject"}
      - Behavioral Segment: ${segment}
      - Monthly Baseline: $${monthlyBaseline.toFixed(2)}
      - Current Month Spend: $${currentMonthSpend.toFixed(2)} (${txCount} transactions)
      - Spending Drift: $${drift.toFixed(2)} (vs. Linear Baseline)
      - Daily Behavioral Velocity: $${currentVelocity.toFixed(2)}/day
      - Tone Protocol: ${user?.nova_tone || "Balanced"}
      - Primary Spending Nodes: ${topCategories || "Insufficient data"}

      Guidelines:
      1. Analyze the telemetry for deviations. If Drift is positive, identify it as a "High-Velocity Surge."
      2. When discussing categories, consider the "Categorical to Ordinal" shift in risk levels.
      3. Distinguish between "Correlation" (e.g., spending on weekends) and "Causation" (e.g., emotional triggers) when possible.
      4. If the user is stressed, suggest a "Brain Defrag" or a "Spending Pause."
      5. Never give direct financial advice; offer analytical insights into behavioral patterns and data integrity.
      6. Keep responses concise, impactful, and professional.
    `;
    const model = genAI$1.getGenerativeModel({
      model: "gemini-1.5-pro",
      systemInstruction: systemPrompt
    });
    const geminiHistory = (history || []).filter((msg) => msg.role === "user" || msg.role === "assistant").map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));
    const chat = model.startChat({
      history: geminiHistory
    });
    const result = await chat.sendMessage(message);
    const responseText = result.response.text();
    res.json({
      role: "assistant",
      content: responseText,
      timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    });
  } catch (err) {
    console.error("Nova Chat Error:", err);
    try {
      const modelFlash = genAI$1.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await modelFlash.generateContent(`${req.body.message} (Note: System is in limited capacity mode)`);
      const text = result.response.text();
      return res.json({
        role: "assistant",
        content: text,
        timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      });
    } catch (innerErr) {
      res.status(500).json({ error: "Nova is currently recalibrating.", detail: err.message });
    }
  }
};
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || "");
const handleAnalysis = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authentication required." });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;
    const userRes = await query(
      `SELECT user_name, baseline_spend, monthly_income FROM dim_users WHERE user_id = $1`,
      [userId]
    );
    const user = userRes.rows[0];
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
    const goalsRes = await query(
      `SELECT goal_name, target_amount, current_progress FROM dim_goals WHERE user_id = $1`,
      [userId]
    );
    const goals = goalsRes.rows;
    const triggerRes = await query(
      `SELECT t.trigger_name, SUM(f.amount) as total
       FROM fact_transactions f
       JOIN dim_triggers t ON f.trigger_id = t.trigger_id
       WHERE f.user_id = $1 AND f.purchase_date >= NOW() - INTERVAL '30 days'
       GROUP BY t.trigger_name ORDER BY total DESC LIMIT 1`,
      [userId]
    );
    const topTrigger = triggerRes.rows[0];
    let goalInsight = "";
    if (goals.length > 0 && savingsImprovement > 0) {
      const primaryGoal = goals[0];
      const remaining = parseFloat(primaryGoal.target_amount) - parseFloat(primaryGoal.current_progress);
      const oldMonthsToGoal = remaining / (lastMonthSavings > 0 ? lastMonthSavings : 1);
      const newMonthsToGoal = remaining / (currentSavings > 0 ? currentSavings : 1);
      const acceleration = oldMonthsToGoal - newMonthsToGoal;
      if (acceleration > 0.1) {
        goalInsight = `Based on your ${savingsImprovement.toFixed(2)} savings delta this month, your '${primaryGoal.goal_name}' is now attainable approximately ${acceleration.toFixed(1)} months faster than your previous trajectory.`;
      }
    }
    const systemPrompt = `
      You are Nova, the Senior Behavioral Financial Analyst.
      Perform a "Deep Scan" on the provided telemetry.
      Use professional terminology: 'Behavioral Velocity', 'Data Integrity', 'Goal Acceleration', 'Spending Drift'.

      Telemetry Overview:
      - Subject: ${user?.user_name || "Subject"}
      - Current Month Spend: $${currentSpend.toFixed(2)}
      - Last Month Spend: $${lastMonthSpend.toFixed(2)}
      - Savings Delta: $${savingsImprovement.toFixed(2)}
      - Top Behavioral Catalyst: ${topTrigger ? topTrigger.trigger_name : "No concentration detected"}
      - Goal Logic: ${goalInsight || "Maintain current trajectory to protect goals."}

      Goal:
      Provide a concise, high-signal behavioral report (max 4-5 sentences). 
      Specifically highlight the "Goal Acceleration" if the user is saving more. 
      Identify if the "Top Behavioral Catalyst" is causing any "Spending Drift".
      Distinguish between "Correlation" and "Causation" in their habits.
      Suggest one "Strategic Intervention".
    `;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
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
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    console.error("Analysis Error:", err);
    res.status(500).json({ error: "Nova Deep Scan failed.", detail: err.message });
  }
};
const handleGetGoals = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authentication required." });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;
    const result = await query(
      `SELECT goal_id, goal_name as name, target_amount as target, current_progress as current, deadline 
       FROM dim_goals WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch goals." });
  }
};
const handleCreateGoal = async (req, res) => {
  const { name, target, deadline } = req.body;
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Authentication required." });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;
    const result = await query(
      `INSERT INTO dim_goals (user_id, goal_name, target_amount, deadline) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, name, target, deadline]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create goal." });
  }
};
const require$1 = createRequire(import.meta.url);
const express = require$1("express");
const cors = require$1("cors");
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:3000").split(",").map((o) => o.trim());
function createServer() {
  const app2 = express();
  app2.use(securityHeaders);
  app2.use(cors({
    origin: (origin, cb) => {
      if (origin && ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error("CORS: Origin not permitted."));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));
  app2.use(express.json({ limit: "1mb" }));
  app2.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app2.get("/api/ping", (_req, res) => res.json({ message: process.env.PING_MESSAGE ?? "ping" }));
  app2.get("/api/demo", handleDemo);
  app2.get("/api/stats", apiLimiter, requireAuth, handleStats);
  app2.post("/api/nova/chat", apiLimiter, requireAuth, handleNovaChat);
  app2.post("/api/nova/analysis", apiLimiter, requireAuth, handleAnalysis);
  app2.get("/api/finance/goals", apiLimiter, requireAuth, handleGetGoals);
  app2.post("/api/finance/goals", apiLimiter, requireAuth, handleCreateGoal);
  app2.post("/api/finance/ingest", ingestLimiter, requireAuth, handleIngest);
  app2.post("/api/auth/login", authLimiter, handleLogin);
  app2.post("/api/auth/signup", authLimiter, handleSignup);
  app2.get("/api/auth/me", requireAuth, handleMe);
  app2.patch("/api/auth/update", requireAuth, handleUpdateProfile);
  return app2;
}
const app = createServer();
const port = process.env.PORT || 3e3;
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = path.dirname(__filename$1);
const distPath = path.resolve(__dirname$1, "../spa");
app.use("/Pulse/assets", express$1.static(path.join(distPath, "assets"), {
  immutable: true,
  maxAge: "1y",
  fallthrough: false
}));
app.use("/Pulse", express$1.static(distPath));
app.use((req, res) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  if (req.path.startsWith("/Pulse")) {
    return res.sendFile(path.join(distPath, "index.html"));
  }
  if (req.path === "/") {
    return res.redirect("/Pulse/");
  }
  res.status(404).json({ error: "Not found" });
});
app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
//# sourceMappingURL=node-build.mjs.map
