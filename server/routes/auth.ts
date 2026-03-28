import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { query } from "../db/db";
import { JWT_SECRET } from "../middleware/security";

// Basic email + password presence check (no library needed)
function validateAuthInput(email: unknown, password: unknown): string | null {
  if (typeof email !== "string" || !email.includes("@") || email.length > 254)
    return "A valid email address is required.";
  if (typeof password !== "string" || password.length < 8)
    return "Password must be at least 8 characters.";
  return null;
}

export const handleMe = async (req: Request, res: Response) => {
  // requireAuth middleware already validated token and set req.userId
  try {
    const result = await query(
      "SELECT user_id, user_name, email, baseline_spend, nova_tone FROM dim_users WHERE user_id = ",
      [req.userId]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ id: user.user_id, email: user.email, name: user.user_name,
      baselineSpend: user.baseline_spend, novaTone: user.nova_tone, onboardingCompleted: true });
  } catch { res.status(500).json({ message: "Internal error." }); }
};

export const handleLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const err = validateAuthInput(email, password);
  if (err) return res.status(400).json({ message: err });
  try {
    const result = await query(
      "SELECT user_id, user_name, email, password, baseline_spend, nova_tone FROM dim_users WHERE email = ",
      [email.toLowerCase().trim()]
    );
    const user = result.rows[0];
    // Constant-time response — do not reveal whether email exists
    const hash = user?.password || "b0";
    const match = await bcrypt.compare(password, hash);
    if (!user || !match) return res.status(401).json({ message: "Invalid credentials." });
    const token = jwt.sign({ id: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.user_id, email: user.email, name: user.user_name,
      baselineSpend: user.baseline_spend, novaTone: user.nova_tone, onboardingCompleted: true } });
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
    const existing = await query("SELECT 1 FROM dim_users WHERE email = ", [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) return res.status(400).json({ message: "An account with that email already exists." });
    const hashed = await bcrypt.hash(password, 12); // 12 rounds for production
    const result = await query(
      "INSERT INTO dim_users (user_name, email, password) VALUES (, , ) RETURNING user_id, user_name, email",
      [name.trim().slice(0, 100), email.toLowerCase().trim(), hashed]
    );
    const u = result.rows[0];
    const token = jwt.sign({ id: u.user_id, email: u.email }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: u.user_id, email: u.email, name: u.user_name, onboardingCompleted: false } });
  } catch (e: any) {
    if (e.code === "ECONNREFUSED") return res.status(503).json({ message: "Database unavailable." });
    res.status(500).json({ message: "Signup error." });
  }
};

export const handleUpdateProfile = async (req: Request, res: Response) => {
  const { name, baselineSpend, novaTone } = req.body;
  const VALID_TONES = ["Gentle", "Balanced", "Driven"];
  if (novaTone && !VALID_TONES.includes(novaTone))
    return res.status(400).json({ message: "novaTone must be Gentle, Balanced, or Driven." });
  try {
    const result = await query(
      "UPDATE dim_users SET user_name = COALESCE(, user_name), baseline_spend = COALESCE(, baseline_spend), nova_tone = COALESCE(, nova_tone) WHERE user_id =  RETURNING user_id, user_name, email, baseline_spend, nova_tone",
      [name?.trim().slice(0,100) || null, baselineSpend || null, novaTone || null, req.userId]
    );
    // FIX: was === -1 (never true). Correct check is === 0.
    if (result.rows.length === 0) return res.status(404).json({ message: "User not found." });
    res.json({ message: "Profile updated.", user: result.rows[0] });
  } catch { res.status(500).json({ message: "Update error." }); }
};