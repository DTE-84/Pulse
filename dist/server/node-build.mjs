import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import * as express from "express";
import express__default from "express";
import cors from "cors";
import pg from "pg";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { spawn } from "child_process";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Stripe from "stripe";
import { Configuration, PlaidEnvironments, PlaidApi, CountryCode, Products } from "plaid";
const handleDemo = (_req, res) => {
  const response = {
    message: "Hello from Express server"
  };
  res.status(200).json(response);
};
const { Pool } = pg;
let pool;
function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      console.warn("[PULSE DB] DATABASE_URL is missing.");
    }
    const isProd = true;
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: isProd
        // Strictly verify in production
      }
    });
  }
  return pool;
}
const query = (text, params) => getPool().query(text, params);
const buildNovaMessage = ({
  mode,
  currentMonthSpend,
  baseline,
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
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Authentication required." });
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
        impact: spendingDrift.toFixed(2),
        status: spendingDrift > baseline * 0.15 ? "High" : "Watch",
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
const _secret = process.env.JWT_SECRET;
const minLen = 32;
if (!_secret || _secret.length < minLen) {
  console.error(`[PULSE SECURITY] FATAL: JWT_SECRET is ${!_secret ? "missing" : "too short"}.`);
  console.error(`Production requires min ${minLen} characters.`);
  process.exit(1);
}
const JWT_SECRET = _secret;
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";
let _supabase;
function getSupabase() {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("[PULSE SECURITY] Supabase URL or Anon Key is missing.");
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}
const requireAuth = async (req, res, next) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authentication required." });
    return;
  }
  const token = h.split(" ")[1];
  try {
    const d = jwt.verify(token, JWT_SECRET);
    req.userId = d.id;
    req.userEmail = d.email;
    return next();
  } catch (err) {
    try {
      const supabase = getSupabase();
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        req.userId = user.id;
        req.userEmail = user.email;
        return next();
      }
      console.error("[PULSE AUTH] Verification failed:", error?.message || "Invalid local token");
    } catch (sErr) {
      console.error("[PULSE AUTH] Supabase client error:", sErr.message);
    }
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
function validateAuthInput(email, password) {
  if (typeof email !== "string" || !email.includes("@") || email.length > 254)
    return "A valid email address is required.";
  if (typeof password !== "string")
    return "Password is required.";
  if (password.length < 8)
    return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password))
    return "Password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(password))
    return "Password must contain at least one lowercase letter.";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
    return "Password must contain at least one special character.";
  return null;
}
const handleMe = async (req, res) => {
  try {
    const result = await query(
      "SELECT user_id, user_name, email, baseline_spend, nova_tone, is_demo, subscription_status, trial_ends_at FROM dim_users WHERE user_id = $1",
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
      onboardingCompleted: true,
      isDemo: user.is_demo,
      subscriptionStatus: user.subscription_status,
      trialEndsAt: user.trial_ends_at
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
      "SELECT user_id, user_name, email, password, baseline_spend, nova_tone, is_demo, subscription_status, trial_ends_at FROM dim_users WHERE email = $1",
      [email.toLowerCase().trim()]
    );
    const user = result.rows[0];
    const hash = user?.password || "b0";
    const match = await bcrypt.compare(password, hash);
    if (!user || !match) return res.status(401).json({ message: "Invalid credentials." });
    const token = jwt.sign({ id: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      token,
      user: {
        id: user.user_id,
        email: user.email,
        name: user.user_name,
        baselineSpend: user.baseline_spend,
        novaTone: user.nova_tone,
        onboardingCompleted: true,
        isDemo: user.is_demo,
        subscriptionStatus: user.subscription_status,
        trialEndsAt: user.trial_ends_at
      }
    });
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
    const existing = await query("SELECT 1 FROM dim_users WHERE email = $1", [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) return res.status(400).json({ message: "An account with that email already exists." });
    const hashed = await bcrypt.hash(password, 12);
    const result = await query(
      "INSERT INTO dim_users (user_name, email, password, is_demo, subscription_status, trial_ends_at) VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '7 days') RETURNING user_id, user_name, email, is_demo, subscription_status, trial_ends_at",
      [name.trim().slice(0, 100), email.toLowerCase().trim(), hashed, false, "trialing"]
    );
    const u = result.rows[0];
    const token = jwt.sign({ id: u.user_id, email: u.email }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({
      token,
      user: {
        id: u.user_id,
        email: u.email,
        name: u.user_name,
        onboardingCompleted: false,
        isDemo: u.is_demo,
        subscriptionStatus: u.subscription_status,
        trialEndsAt: u.trial_ends_at
      }
    });
  } catch (e) {
    if (e.code === "ECONNREFUSED") return res.status(503).json({ message: "Database unavailable." });
    res.status(500).json({ message: "Signup error." });
  }
};
const handleGuestSignup = async (req, res) => {
  console.log("[Guest Signup] Initializing unique protocol...");
  try {
    const guestId = Math.random().toString(36).substring(7);
    const email = `guest_${guestId}@pulse.demo`;
    console.log("[Guest Signup] Hashing password...");
    const password = await bcrypt.hash(Math.random().toString(36), 12);
    const name = `Guest User ${guestId.toUpperCase()}`;
    console.log(`[Guest Signup] Provisioning identity: ${email}`);
    console.log("[Guest Signup] Executing DB query...");
    const result = await query(
      "INSERT INTO dim_users (user_name, email, password, is_demo, subscription_status, trial_ends_at) VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '7 days') RETURNING user_id, user_name, email, is_demo, subscription_status, trial_ends_at",
      [name, email, password, true, "trialing"]
    );
    const u = result.rows[0];
    if (!u) throw new Error("Database insertion returned no data.");
    console.log(`[Guest Signup] Database entry confirmed: ${u.user_id}`);
    let token;
    try {
      console.log("[Guest Signup] Signing JWT...");
      token = jwt.sign({ id: u.user_id, email: u.email }, JWT_SECRET, { expiresIn: "7d" });
      console.log("[Guest Signup] Uplink token generated.");
    } catch (jwtErr) {
      console.error("[Guest Signup] JWT Error:", jwtErr);
      return res.status(500).json({ message: "Uplink Token Error", detail: jwtErr.message });
    }
    console.log("[Guest Signup] Sending success response...");
    res.status(201).json({
      token,
      user: {
        id: u.user_id,
        email: u.email,
        name: u.user_name,
        onboardingCompleted: true,
        isDemo: true,
        subscriptionStatus: u.subscription_status,
        trialEndsAt: u.trial_ends_at
      }
    });
  } catch (err) {
    console.error("[Guest Signup] FATAL ERROR:", err);
    if (err.code === "ECONNREFUSED" || err.message.includes("connection")) {
      return res.status(503).json({
        message: "Sandbox Database Offline",
        detail: "The high-fidelity telemetry environment is currently unreachable."
      });
    }
    res.status(500).json({
      message: "Guest Initialization Failed",
      detail: err.message,
      stack: void 0
    });
  }
};
const handleUpdateProfile = async (req, res) => {
  const { name, baselineSpend, novaTone } = req.body;
  const VALID_TONES = ["Gentle", "Balanced", "Driven"];
  if (novaTone && !VALID_TONES.includes(novaTone))
    return res.status(400).json({ message: "novaTone must be Gentle, Balanced, or Driven." });
  try {
    const result = await query(
      "UPDATE dim_users SET user_name = COALESCE($1, user_name), baseline_spend = COALESCE($2, baseline_spend), nova_tone = COALESCE($3, nova_tone) WHERE user_id = $4 RETURNING user_id, user_name, email, baseline_spend, nova_tone, is_demo",
      [name?.trim().slice(0, 100) || null, baselineSpend || null, novaTone || null, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "User not found." });
    res.json({ message: "Profile updated.", user: result.rows[0] });
  } catch {
    res.status(500).json({ message: "Update error." });
  }
};
const handleDeleteAccount = async (req, res) => {
  try {
    await query("DELETE FROM dim_users WHERE user_id = $1", [req.userId]);
    res.json({ message: "Account successfully terminated." });
  } catch {
    res.status(500).json({ message: "Termination error." });
  }
};
const __filename$2 = fileURLToPath(import.meta.url);
const __dirname$2 = path.dirname(__filename$2);
const MAX_TRANSACTIONS = 500;
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || "");
const handleIngest = async (req, res) => {
  const { transactions } = req.body;
  const userId = req.userId;
  if (!Array.isArray(transactions) || transactions.length === 0)
    return res.status(400).json({ error: "transactions must be a non-empty array." });
  if (transactions.length > MAX_TRANSACTIONS)
    return res.status(400).json({ error: `Payload exceeds maximum of ${MAX_TRANSACTIONS} transactions.` });
  let enrichedTransactions = transactions;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      You are Nova's Behavioral Data Wrangler. 
      Analyze the following transactions and ensure they have a 'category' and 'risk_level'.
      
      Categories: Dining, Groceries, Transport, Entertainment, Utilities, Rent, Shopping, Healthcare, Misc.
      Risk Levels (Categorical to Ordinal Mapping): Low, Medium, High, Critical.
      
      Return ONLY a valid JSON array of objects with the fields: date, amount, category, risk_level.
      Maintain absolute Data Integrity. If a category is ambiguous, use 'Misc'.
      
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
  const headers = "date,amount,category,risk_level,trigger_id";
  const rows = enrichedTransactions.map((t) => [
    sanitizeCsvField(t.date),
    sanitizeCsvField(t.amount),
    sanitizeCsvField(t.category || "Misc"),
    sanitizeCsvField(t.risk_level || "Medium"),
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
      const [date, amount, category, risk_level, trigger_id] = parts;
      let catResult = await query("SELECT category_id FROM dim_categories WHERE category_name = $1", [category]);
      let categoryId;
      if (catResult.rows.length === 0) {
        const newCat = await query(
          "INSERT INTO dim_categories (category_name, risk_level) VALUES ($1, $2) RETURNING category_id",
          [category, risk_level || "Medium"]
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
const handleNovaChat = async (req, res) => {
  const userId = req.userId;
  console.log(`[Nova Chat] Signal Received from User: ${userId}`);
  try {
    const { message, history } = req.body;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }
    if (!message || typeof message !== "string") {
      return res.status(400).json({ message: "Invalid payload: message is required and must be a string." });
    }
    if (history && !Array.isArray(history)) {
      return res.status(400).json({ message: "Invalid payload: history must be an array." });
    }
    if (message.length > 2e3) {
      return res.status(400).json({ message: "Message exceeds 2000 character limit." });
    }
    console.log("[Nova Chat] Querying user telemetry...");
    let user;
    try {
      const userRes = await query(
        `SELECT user_name, baseline_spend, nova_tone, monthly_income, subscription_status, trial_ends_at FROM dim_users WHERE user_id = $1`,
        [userId]
      );
      user = userRes.rows[0];
    } catch (dbErr) {
      console.error("[Nova Chat] DB Error (User Context):", dbErr.message);
      return res.status(500).json({ error: "Telemetry Linkage Failed", detail: dbErr.message });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const hasActiveSub = user.subscription_status === "active" || user.subscription_status === "trialing" && new Date(user.trial_ends_at) > /* @__PURE__ */ new Date();
    if (!hasActiveSub) {
      return res.status(403).json({
        message: "Elite Access Required",
        detail: "Your trial has ended or subscription is inactive. Please activate Elite membership to continue."
      });
    }
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
    } catch (dbErr) {
      console.error("[Nova Chat] DB Error (Spending Stats):", dbErr.message);
    }
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
      topCategories = categoryRes.rows.map((r) => `${r.category_name} ($${parseFloat(r.total).toFixed(2)})`).join(", ");
    } catch (dbErr) {
      console.error("[Nova Chat] DB Error (Top Categories):", dbErr.message);
    }
    const dayOfMonth = (/* @__PURE__ */ new Date()).getDate();
    const monthlyBaseline = parseFloat(user?.baseline_spend || "2500");
    const dailyBaseline = monthlyBaseline / 30;
    const currentVelocity = currentMonthSpend / (dayOfMonth || 1);
    const drift = currentMonthSpend - dailyBaseline * dayOfMonth;
    const systemPrompt = `
      You are Nova, the Advanced Financial AI Consultant.
      Persona: Senior Systems Engineer and Behavioral Analyst. 
      Values: Data Integrity, Signal Clarity, Deterministic Architecture.

      User Telemetry:
      - Subject: ${user?.user_name || "Anonymous Subject"}
      - Monthly Baseline: $${monthlyBaseline.toFixed(2)}
      - Current Month Spend: $${currentMonthSpend.toFixed(2)} (${txCount} nodes)
      - Spending Drift: $${drift.toFixed(2)}
      - Daily Velocity: $${currentVelocity.toFixed(2)}/day
      - Active Categories: ${topCategories || "Establishing baseline"}

      Guidelines:
      - Use Senior Analyst terminology.
      - Never give direct financial advice.
      - Provide high-signal behavioral insights.
      - Conclude with a clinical yet supportive tone.
    `;
    console.log("[Nova Chat] Engaging Gemini 1.5 Flash...");
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_GENAI_API_KEY is missing from environment.");
    const genAI2 = new GoogleGenerativeAI(apiKey);
    const model = genAI2.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt
    });
    const geminiHistory = (history || []).filter((msg) => msg.role === "user" || msg.role === "assistant").map((msg) => ({
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
      timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    });
  } catch (err) {
    console.error("[Nova Chat CRITICAL FAILURE]:", err.message);
    return res.status(500).json({
      message: "Nova Uplink Interrupted",
      detail: "The analytical link could not be established.",
      hint: void 0
    });
  }
};
const handleAnalysis = async (req, res) => {
  const userId = req.userId;
  console.log(`[Nova Deep Scan] Initiated for User: ${userId}`);
  try {
    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }
    console.log("[Nova Analysis] Querying dim_users...");
    let user;
    try {
      const userRes = await query(
        `SELECT user_name, baseline_spend, monthly_income, subscription_status, trial_ends_at FROM dim_users WHERE user_id = $1`,
        [userId]
      );
      user = userRes.rows[0];
    } catch (dbErr) {
      console.error("[Nova Analysis] DB Error (dim_users):", dbErr.message);
      return res.status(500).json({ error: "Telemetry Linkage Failed", detail: dbErr.message });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const hasActiveSub = user.subscription_status === "active" || user.subscription_status === "trialing" && new Date(user.trial_ends_at) > /* @__PURE__ */ new Date();
    if (!hasActiveSub) {
      return res.status(403).json({
        message: "Elite Access Required",
        detail: "Your trial has ended or subscription is inactive. Please activate Elite membership to continue."
      });
    }
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
    } catch (dbErr) {
      console.error("[Nova Analysis] DB Error (fact_transactions):", dbErr.message);
    }
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
    console.log("[Nova Analysis] Querying dim_goals...");
    let goals = [];
    try {
      const goalsRes = await query(
        `SELECT goal_name, target_amount, current_progress FROM dim_goals WHERE user_id = $1`,
        [userId]
      );
      goals = goalsRes.rows;
    } catch (dbErr) {
      console.error("[Nova Analysis] DB Error (dim_goals):", dbErr.message);
    }
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
    } catch (dbErr) {
      console.error("[Nova Analysis] DB Error (dim_triggers):", dbErr.message);
    }
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
      - Subject: ${user?.user_name || "Anonymous Subject"}
      - Monthly Income: $${income.toFixed(2)}
      - Current Spend: $${currentSpend.toFixed(2)}
      - Last Month Spend: $${lastMonthSpend.toFixed(2)}
      - Savings Improvement: $${savingsImprovement.toFixed(2)}
      - Top Catalyst: ${topTrigger ? topTrigger.trigger_name : "Stable Rhythm"}
      - Goal Logic: ${goalInsight || "Deterministic trajectory maintained."}

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
        const genAI2 = new GoogleGenerativeAI(apiKey);
        const model = genAI2.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(systemPrompt);
        if (!result || !result.response) {
          throw new Error("Empty response from Gemini.");
        }
        report = result.response.text();
        console.log("[Nova Analysis] Deep Scan Successful.");
      } catch (aiErr) {
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
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    console.error("[Nova Analysis CRITICAL FAILURE]:", err.message);
    res.status(500).json({
      error: "Nova Uplink Interrupted",
      detail: err.message,
      hint: "Verify DB connectivity."
    });
  }
};
function generateFallbackReport(name = "Subject", spend, savings, trigger, goal) {
  const trend = savings >= 0 ? "positive" : "concerning";
  const velocity = spend > 0 ? "active" : "dormant";
  return `Telemetry scan for ${name} complete. Your current spending velocity is ${velocity} at $${spend.toFixed(2)}. We've detected a ${trend} savings delta of $${Math.abs(savings).toFixed(2)} compared to last month. ${trigger ? `Primary catalyst identified: ${trigger}.` : "Behavioral rhythm remains stable."} ${goal || "No immediate goal drift detected."} Protocol: Initiate 'Brain Defrag' to optimize monthly trajectory.`;
}
const handleGetGoals = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized access." });
    const result = await query(
      `SELECT goal_id, goal_name as name, target_amount as target, current_progress as current, deadline 
       FROM dim_goals WHERE user_id = $1 ORDER BY updated_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("[GOALS_GET_ERROR]", err);
    res.status(500).json({ error: "Failed to fetch goals." });
  }
};
const handleCreateGoal = async (req, res) => {
  try {
    const { name, target, deadline } = req.body;
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized access." });
    if (!name || target === void 0 || target === null) {
      return res.status(400).json({ error: "Goal name and target amount are required." });
    }
    const result = await query(
      `INSERT INTO dim_goals (user_id, goal_name, target_amount, deadline) 
       VALUES ($1, $2, $3, $4) RETURNING goal_id, goal_name as name, target_amount as target, current_progress as current, deadline`,
      [userId, name, target, deadline || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("[GOALS_CREATE_ERROR]", err);
    res.status(500).json({ error: "Failed to create goal." });
  }
};
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !endpointSecret) {
    console.error("[Stripe Webhook] Missing signature or secret.");
    return res.status(400).send("Webhook Error: Missing signature or secret.");
  }
  req.body;
  console.log("[Stripe Webhook] Event Received.");
  res.json({ received: true });
};
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = STRIPE_KEY ? new Stripe(STRIPE_KEY, {
  apiVersion: "2023-10-16"
}) : null;
const createCheckoutSession = async (req, res) => {
  if (!stripe) {
    return res.status(503).json({
      message: "Payment Uplink Offline",
      detail: "Stripe API Key is missing from the environment. Secure payments are currently disabled."
    });
  }
  const { planName, isAnnual } = req.body;
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "Authentication required." });
  const prices = {
    "Elite_Monthly": process.env.STRIPE_PRICE_ELITE_MONTHLY || "",
    "Elite_Annual": process.env.STRIPE_PRICE_ELITE_ANNUAL || "",
    "Pro_Monthly": process.env.STRIPE_PRICE_PRO_MONTHLY || "",
    "Pro_Annual": process.env.STRIPE_PRICE_PRO_ANNUAL || ""
  };
  const priceKey = `${planName}_${isAnnual ? "Annual" : "Monthly"}`;
  const priceId = prices[priceKey];
  if (!priceId && true) {
    return res.status(400).json({ message: "Invalid plan selection or price ID missing." });
  }
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId || "price_dummy_for_dev",
          // Fallback for dev testing
          quantity: 1
        }
      ],
      mode: "subscription",
      success_url: `${process.env.APP_BASE_URL || "http://localhost:5173"}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_BASE_URL || "http://localhost:5173"}/subscription?canceled=true`,
      client_reference_id: userId,
      metadata: {
        userId,
        planName
      }
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error("[Stripe] Checkout Error:", err.message);
    res.status(500).json({ message: "Could not establish secure payment uplink." });
  }
};
const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET
    }
  }
});
const client = new PlaidApi(configuration);
const createLinkToken = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "Authentication required." });
  try {
    const userRes = await query("SELECT subscription_status FROM dim_users WHERE user_id = $1", [userId]);
    const user = userRes.rows[0];
    if (!user || user.subscription_status !== "active") {
      return res.status(403).json({
        message: "Elite Uplink Required",
        detail: "Real-world bank synchronization is reserved for active Elite members. Trial users can utilize the 'Sandbox Sync' for behavioral modeling."
      });
    }
    const response = await client.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: "Pulse Ai",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en"
    });
    res.json(response.data);
  } catch (err) {
    console.error("[Plaid] Link Token Error:", err.response?.data || err.message);
    res.status(500).json({ message: "Could not initialize bank linkage." });
  }
};
const exchangePublicToken = async (req, res) => {
  const { publicToken, institutionName } = req.body;
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "Authentication required." });
  try {
    const response = await client.itemPublicTokenExchange({
      public_token: publicToken
    });
    const { access_token, item_id } = response.data;
    const itemResult = await query(
      `INSERT INTO public.plaid_items (user_id, plaid_item_id, institution_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (plaid_item_id) DO UPDATE SET status = 'active', updated_at = NOW()
       RETURNING item_id`,
      [userId, item_id, institutionName]
    );
    const internalItemId = itemResult.rows[0].item_id;
    await query(
      `INSERT INTO public.plaid_secrets (item_id, access_token_encrypted)
       VALUES ($1, $2)
       ON CONFLICT (item_id) DO UPDATE SET access_token_encrypted = EXCLUDED.access_token_encrypted`,
      [internalItemId, access_token]
    );
    res.json({ message: "Bank successfully linked to Pulse telemetry." });
  } catch (err) {
    console.error("[Plaid] Exchange Error:", err.response?.data || err.message);
    res.status(500).json({ message: "Could not established analytical link to bank." });
  }
};
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:3000,https://pulse-nova-solutions.vercel.app,https://dte-solutions.icu").split(",").map((o) => o.trim());
function createServer() {
  const app2 = express__default();
  app2.use(securityHeaders);
  app2.use(cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      if (origin.endsWith(".vercel.app")) return cb(null, true);
      cb(new Error(`CORS: Origin ${origin} not permitted.`));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));
  app2.post("/api/webhooks/stripe", express__default.raw({ type: "application/json" }), handleStripeWebhook);
  app2.use(express__default.json({ limit: "1mb" }));
  app2.use(express__default.urlencoded({ extended: true, limit: "1mb" }));
  app2.get("/api/ping", (_req, res) => res.json({ message: "ping", status: "Deterministic Uplink Active" }));
  app2.post("/api/payments/create-session", requireAuth, createCheckoutSession);
  app2.post("/api/plaid/create-link-token", requireAuth, createLinkToken);
  app2.post("/api/plaid/exchange-token", requireAuth, exchangePublicToken);
  app2.get("/api/demo", handleDemo);
  app2.get("/api/stats", apiLimiter, requireAuth, handleStats);
  app2.post("/api/nova/chat", apiLimiter, requireAuth, handleNovaChat);
  app2.post("/api/nova/analysis", apiLimiter, requireAuth, handleAnalysis);
  app2.get("/api/finance/goals", apiLimiter, requireAuth, handleGetGoals);
  app2.post("/api/finance/goals", apiLimiter, requireAuth, handleCreateGoal);
  app2.post("/api/finance/ingest", ingestLimiter, requireAuth, handleIngest);
  app2.post("/api/auth/login", authLimiter, handleLogin);
  app2.post("/api/auth/signup", authLimiter, handleSignup);
  app2.post("/api/auth/guest", authLimiter, handleGuestSignup);
  app2.get("/api/auth/me", requireAuth, handleMe);
  app2.patch("/api/auth/update", requireAuth, handleUpdateProfile);
  app2.delete("/api/auth/delete", requireAuth, handleDeleteAccount);
  app2.get("/api/debug/system", requireAuth, async (req, res) => {
    res.json({
      userId: req.userId,
      env: {
        has_gemini_key: !!process.env.GOOGLE_GENAI_API_KEY,
        has_supabase_url: !!process.env.VITE_SUPABASE_URL,
        node_env: "production"
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app2.use((err, _req, res, _next) => {
    console.error("[PULSE SERVER CRASH]:", err.message);
    res.status(err.status || 500).json({
      message: "Nova Uplink Interrupted",
      detail: "Internal Signal Error. Our engineers have been alerted.",
      code: err.code || "INTERNAL_ERROR"
    });
  });
  return app2;
}
const app = createServer();
const port = process.env.PORT || 3e3;
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = path.dirname(__filename$1);
const distPath = path.resolve(__dirname$1, "../spa");
app.use("/Pulse/assets", express.static(path.join(distPath, "assets"), {
  immutable: true,
  maxAge: "1y",
  fallthrough: false
}));
app.use("/Pulse", express.static(distPath));
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
