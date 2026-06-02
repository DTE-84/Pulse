import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { query } from "../db/db";
import { seedGuestData } from "../db/seed-guest";
import { JWT_SECRET, getSupabaseAdmin, authLimiter, requireAuth } from "../middleware/security";

const router = Router();

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

export const handleGuestSignup = async (_req: Request, res: Response) => {
  console.log("[PULSE AUTH] Initializing Guest Sandbox Protocol...");
  
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const guestId = Math.random().toString(36).substring(7);
    const email = `guest_${guestId}@pulse.demo`;
    const password = Math.random().toString(36) + "A1!"; // Ensure it meets complexity
    const name = `Guest User ${guestId.toUpperCase()}`;

    console.log(`[PULSE AUTH] Provisioning Supabase Auth identity: ${email}`);

    // 1. Create User in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (authError) {
      console.error("[PULSE AUTH] Supabase Auth Creation Failed:", authError.message);
      return res.status(500).json({ 
        message: "Sandbox Identity Failure", 
        detail: authError.message 
      });
    }

    const user = authData.user;
    console.log(`[PULSE AUTH] Identity confirmed: ${user.id}`);

    // 2. Update the profile created by the trigger
    // The trigger public.handle_new_user() should have already created the dim_users record.
    console.log("[PULSE AUTH] Refining demo profile...");
    const { data: _profile, error: profileError } = await supabaseAdmin
      .from("dim_users")
      .update({
        is_demo: true,
        subscription_status: 'trialing',
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        onboarding_completed: true // Guests skip onboarding
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (profileError) {
      console.warn("[PULSE AUTH] Profile refinement failed (might need retry):", profileError.message);
      // We'll try to insert if it's missing (though trigger should handle it)
      await supabaseAdmin.from("dim_users").upsert([{
        user_id: user.id,
        user_name: name,
        email: email,
        is_demo: true,
        subscription_status: 'trialing',
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        onboarding_completed: true
      }]);
    }

    // 3. High-Fidelity Signal Seeding
    try {
      console.log("[PULSE AUTH] Injecting behavioral signals...");
      await seedGuestData(user.id);
    } catch (seedErr: any) {
      console.warn("[PULSE AUTH] Signal seeding interrupted:", seedErr.message);
    }

    // 4. Generate REAL Supabase Session for the Guest
    console.log("[PULSE AUTH] Generating Supabase session...");
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (sessionError || !sessionData.session) {
      console.error("[PULSE AUTH] Session Generation Failed:", sessionError?.message);
      // Fallback to local JWT if Supabase session fails (unlikely but safe)
      const secret = process.env.JWT_SECRET || "";
      const token = jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: "7d" });
      
      res.status(201).json({ 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          name: name, 
          onboardingCompleted: true, 
          isDemo: true,
          subscriptionStatus: 'trialing',
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        } 
      });
    } else {
      console.log("[PULSE AUTH] Guest Sandbox Protocol Complete.");
      res.status(201).json({ 
        token: sessionData.session.access_token,
        refreshToken: sessionData.session.refresh_token,
        user: { 
          id: user.id, 
          email: user.email, 
          name: name, 
          onboardingCompleted: true, 
          isDemo: true,
          subscriptionStatus: 'trialing',
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        } 
      });
    }
  } catch (err: any) {
    console.error("[PULSE AUTH] General Failure:", err.message);
    res.status(500).json({ 
      message: "Guest Protocol Failure", 
      detail: err.message
    });
  }
};

export const handleDebug = async (_req: Request, res: Response) => {
  const telemetry: any = {
    status: "Initializing",
    timestamp: new Date().toISOString(),
    env: {
      has_db_url: !!process.env.DATABASE_URL,
      has_jwt_secret: !!process.env.JWT_SECRET,
      has_plaid_client_id: !!process.env.PLAID_CLIENT_ID,
      has_plaid_secret: !!process.env.PLAID_SECRET,
      plaid_env: process.env.PLAID_ENV || "not_set (defaulting to sandbox)",
      node_env: process.env.NODE_ENV,
      vercel_env: process.env.VERCEL_ENV || "local"
    }
  };

  try {
    if (!process.env.DATABASE_URL) {
      telemetry.status = "Environment Warning";
      telemetry.error = "DATABASE_URL is missing.";
      return res.json(telemetry);
    }

    const dbStatus = await query("SELECT COUNT(*) FROM dim_users");
    telemetry.status = "Online";
    telemetry.db = {
      users_count: dbStatus.rows[0].count,
      connected: true
    };
    res.json(telemetry);
  } catch (err: any) {
    telemetry.status = "Database Error";
    telemetry.error = {
      message: err.message,
      code: err.code,
      hint: err.hint,
      detail: err.detail
    };
    res.status(500).json(telemetry);
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

// Route Definitions
router.post("/login", authLimiter, handleLogin as any);
router.post("/signup", authLimiter, handleSignup as any);
router.post("/guest", authLimiter, handleGuestSignup as any);
router.get("/me", requireAuth, handleMe as any);
router.patch("/update", requireAuth, handleUpdateProfile as any);
router.delete("/delete", requireAuth, handleDeleteAccount as any);

export default router;