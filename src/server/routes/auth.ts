import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { query } from "../db/db";
import { JWT_SECRET } from "../middleware/security";

// Basic email + password presence check (no library needed)
function validateAuthInput(email: unknown, password: unknown): string | null {
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

export const handleMe = async (req: Request, res: Response) => {
  // requireAuth middleware already validated token and set req.userId
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
  } catch { res.status(500).json({ message: "Internal error." }); }
};

export const handleLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const err = validateAuthInput(email, password);
  if (err) return res.status(400).json({ message: err });
  try {
    const result = await query(
      "SELECT user_id, user_name, email, password, baseline_spend, nova_tone, is_demo, subscription_status, trial_ends_at FROM dim_users WHERE email = $1",
      [email.toLowerCase().trim()]
    );
    const user = result.rows[0];
    // Constant-time response — do not reveal whether email exists
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
  } catch (e: any) {
    if (e.code === "ECONNREFUSED") return res.status(503).json({ message: "Database unavailable." });
    res.status(500).json({ message: "Authentication error." });
  }
};

export const handleSignup = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  const err = validateAuthInput(email, password);
  if (err) return res.status(400).json({ message: err });
  if (typeof name !== "string" || name.trim().length < 1)
    return res.status(400).json({ message: "Name is required." });
  try {
    const existing = await query("SELECT 1 FROM dim_users WHERE email = $1", [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) return res.status(400).json({ message: "An account with that email already exists." });
    const hashed = await bcrypt.hash(password, 12); // 12 rounds for production
    const result = await query(
      "INSERT INTO dim_users (user_name, email, password, is_demo, subscription_status, trial_ends_at) VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '7 days') RETURNING user_id, user_name, email, is_demo, subscription_status, trial_ends_at",
      [name.trim().slice(0, 100), email.toLowerCase().trim(), hashed, false, 'trialing']
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
  } catch (e: any) {
    if (e.code === "ECONNREFUSED") return res.status(503).json({ message: "Database unavailable." });
    res.status(500).json({ message: "Signup error." });
  }
};

export const handleGuestSignup = async (req: Request, res: Response) => {
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
      [name, email, password, true, 'trialing']
    );
    
    if (!result || !result.rows || result.rows.length === 0) {
      throw new Error("Database insertion returned no rows.");
    }

    const u = result.rows[0];
    console.log(`[Guest Signup] Database entry confirmed: ${u.user_id}`);
    
    let token;
    try {
      console.log("[Guest Signup] Signing JWT...");
      token = jwt.sign({ id: u.user_id, email: u.email }, JWT_SECRET, { expiresIn: "7d" });
      console.log("[Guest Signup] Uplink token generated.");
    } catch (jwtErr: any) {
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
  } catch (err: any) {
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
      stack: process.env.NODE_ENV === "production" ? undefined : err.stack
    });
  }
};


export const handleUpdateProfile = async (req: Request, res: Response) => {
  const { name, baselineSpend, novaTone } = req.body;
  const VALID_TONES = ["Gentle", "Balanced", "Driven"];
  if (novaTone && !VALID_TONES.includes(novaTone))
    return res.status(400).json({ message: "novaTone must be Gentle, Balanced, or Driven." });
  try {
    const result = await query(
      "UPDATE dim_users SET user_name = COALESCE($1, user_name), baseline_spend = COALESCE($2, baseline_spend), nova_tone = COALESCE($3, nova_tone) WHERE user_id = $4 RETURNING user_id, user_name, email, baseline_spend, nova_tone, is_demo",
      [name?.trim().slice(0,100) || null, baselineSpend || null, novaTone || null, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "User not found." });
    res.json({ message: "Profile updated.", user: result.rows[0] });
  } catch { res.status(500).json({ message: "Update error." }); }
};

export const handleDeleteAccount = async (req: Request, res: Response) => {
  try {
    // Note: CASCADE in DB should handle transactions, goals, etc.
    await query("DELETE FROM dim_users WHERE user_id = $1", [req.userId]);
    res.json({ message: "Account successfully terminated." });
  } catch { res.status(500).json({ message: "Termination error." }); }
};