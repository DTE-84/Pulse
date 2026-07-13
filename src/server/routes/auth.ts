import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import { query } from "../db/db.js";
import { getSupabase, getSupabaseAdmin, authLimiter, requireAuth, logAuditAction } from "../middleware/security.js";

const router = Router();

// Basic email + password presence check (no library needed)
function validateAuthInput(email: unknown, password: unknown): string | null {
  if (typeof email !== "string" || !email.includes("@") || email.length > 254)
    return "A valid email address is required.";
  
  if (typeof password !== "string" || password.length < 1)
    return "Password is required.";

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
      onboardingCompleted: user.onboarding_completed, 
      isDemo: user.is_demo,
      subscriptionStatus: user.subscription_status,
      trialEndsAt: user.trial_ends_at
    });
  } catch (err: any) { 
    const isProd = process.env.NODE_ENV === "production";
    console.error("[AUTH ME] Error:", err.message);
    res.status(500).json({ 
      message: "Internal error.", 
      detail: isProd ? "Identity uplink interrupted." : err.message 
    }); 
  }
};

export const handleLogin = async (req: Request, res: Response) => {
  const { email: rawEmail, password } = req.body;
  const email = typeof rawEmail === "string" ? rawEmail.trim() : rawEmail;
  const err = validateAuthInput(email, password);
  if (err) return res.status(400).json({ message: err });

  try {
    console.log(`[AUTH LOGIN] Initiating authentication for: ${email}`);
    
    // Use the standard client (anon key) for user-level login
    const supabase = getSupabase();
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.warn(`[AUTH LOGIN] Denied: ${email} - ${authError.message}`);
      return res.status(401).json({ 
        message: authError.message.includes("Email not confirmed") 
          ? "Please verify your email before logging in." 
          : "Invalid credentials." 
      });
    }

    const session = authData.session;
    const user = authData.user;
    if (!session || !user) throw new Error("Identity provisioning failed.");

    console.log(`[AUTH LOGIN] Uplink successful: ${user.id}`);

    // Fetch profile from dim_users
    const result = await query(
      "SELECT user_id, user_name, email, baseline_spend, nova_tone, onboarding_completed, is_demo, subscription_status, trial_ends_at FROM dim_users WHERE user_id = $1",
      [user.id]
    );
    const profile = result.rows[0];

    // Log the audit event
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
    await logAuditAction(user.id, "LOGIN", ip, { user_email: user.email });

    res.json({ 
      token: session.access_token,
      refreshToken: session.refresh_token,
      user: { 
        id: profile?.user_id || user.id, 
        email: profile?.email || user.email, 
        name: profile?.user_name || user.user_metadata?.name || "User",
        baselineSpend: profile?.baseline_spend, 
        novaTone: profile?.nova_tone, 
        onboardingCompleted: profile?.onboarding_completed || false, 
        isDemo: profile?.is_demo || false,
        subscriptionStatus: profile?.subscription_status || 'trialing',
        trialEndsAt: profile?.trial_ends_at
      } 
    });
  } catch (e: any) {
    console.error("[AUTH LOGIN] FATAL Failure:", e.message);
    res.status(500).json({ 
      message: "Authentication protocol interrupted.", 
      detail: e.message 
    });
  }
};

export const handleSignup = async (req: Request, res: Response) => {
  const { email: rawEmail, password, name } = req.body;
  const email = typeof rawEmail === "string" ? rawEmail.trim() : rawEmail;
  const err = validateAuthInput(email, password);
  if (err) return res.status(400).json({ message: err });
  if (typeof name !== "string" || name.trim().length < 1)
    return res.status(400).json({ message: "Name is required." });

  try {
    console.log(`[AUTH SIGNUP] Initiating signup for: ${email}`);
    
    // Use the standard client (anon key) to trigger the Supabase confirmation email
    const supabase = getSupabase();
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (authError) {
      console.error("[AUTH SIGNUP] Supabase Error:", authError.message);
      return res.status(400).json({ message: authError.message });
    }

    const user = authData.user;
    if (!user) throw new Error("User creation failed.");

    // Fetch the actual record from DB to get the source-of-truth trial date (set by trigger)
    let profile;
    try {
      const result = await query(
        "SELECT subscription_status, trial_ends_at FROM dim_users WHERE user_id = $1",
        [user.id]
      );
      profile = result.rows[0];
    } catch (dbErr) {
      console.warn("[AUTH SIGNUP] Profile fetch for trial date failed, using fallback.");
    }
    
    return res.status(201).json({ 
      token: authData.session?.access_token || null,
      refreshToken: authData.session?.refresh_token || null,
      user: { 
        id: user.id, 
        email: user.email, 
        name,
        onboardingCompleted: false, 
        isDemo: false,
        subscriptionStatus: profile?.subscription_status || 'trialing',
        trialEndsAt: profile?.trial_ends_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      } 
    });
  } catch (e: any) {
    const isProd = process.env.NODE_ENV === "production";
    console.error("[AUTH SIGNUP] General Error:", e.message);
    res.status(500).json({ 
      message: "Signup error.", 
      detail: isProd ? "Could not initialize account." : e.message 
    });
  }
};

export const handleGuestSignup = async (_req: Request, res: Response) => {
  const sandboxUserId = process.env.SANDBOX_USER_ID || 'ddeaa710-caf5-4b3f-949c-5e1e27b0959b';

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET missing.');

    const token = jwt.sign(
      { id: sandboxUserId, email: 'sandbox@pulse.demo' },
      secret,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      token,
      user: {
        id: sandboxUserId,
        email: 'sandbox@pulse.demo',
        name: 'Sandbox User',
        onboardingCompleted: true,
        isDemo: true,
        subscriptionStatus: 'trialing',
        trialEndsAt: null,
      }
    });
  } catch (err: any) {
    return res.status(500).json({ message: 'Sandbox login failed.', detail: err.message });
  }
};

export const handleDebug = async (_req: Request, res: Response) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ message: "Node not found." });
  }

  const telemetry: any = {
    status: "Initializing",
    timestamp: new Date().toISOString(),
    env: {
      has_db_url: !!process.env.DATABASE_URL,
      has_jwt_secret: !!process.env.JWT_SECRET,
      has_supabase_url: !!process.env.VITE_SUPABASE_URL,
      has_supabase_anon: !!process.env.VITE_SUPABASE_ANON_KEY,
      has_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      node_env: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL
    }
  };

  try {
    console.log("[DEBUG] Testing DB Connection...");
    const dbStatus = await query("SELECT NOW() as now, COUNT(*) as count FROM dim_users");
    telemetry.status = "Online";
    telemetry.db = {
      connected: true,
      time: dbStatus.rows[0].now,
      users_count: dbStatus.rows[0].count
    };
    
    console.log("[DEBUG] DB Check Passed.");
    res.json(telemetry);
  } catch (err: any) {
    console.error("[DEBUG] DB Check Failed:", err.message);
    telemetry.status = "Database Error";
    telemetry.error = {
      message: err.message,
      code: err.code,
      detail: err.detail
    };
    res.status(500).json(telemetry);
  }
};


export const handleUpdateProfile = async (req: Request, res: Response) => {
  const { name, baselineSpend, novaTone, onboardingCompleted, intentions } = req.body;
  const VALID_TONES = ["Gentle", "Balanced", "Driven"];
  if (novaTone && !VALID_TONES.includes(novaTone))
    return res.status(400).json({ message: "novaTone must be Gentle, Balanced, or Driven." });
  try {
    const result = await query(
      `UPDATE dim_users SET 
        user_name = COALESCE($1, user_name), 
        baseline_spend = COALESCE($2, baseline_spend), 
        nova_tone = COALESCE($3, nova_tone),
        onboarding_completed = COALESCE($4, onboarding_completed),
        intentions = COALESCE($5, intentions)
       WHERE user_id = $6 
       RETURNING user_id, user_name, email, baseline_spend, nova_tone, is_demo, onboarding_completed, intentions`,
      [
        name?.trim().slice(0,100) || null, 
        baselineSpend || null, 
        novaTone || null, 
        onboardingCompleted ?? null,
        intentions || null,
        req.userId
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "User not found." });
    res.json({ message: "Profile updated.", user: result.rows[0] });
  } catch (err: any) { 
    const isProd = process.env.NODE_ENV === "production";
    res.status(500).json({ 
      message: "Update error.",
      detail: isProd ? "Could not commit profile changes." : err.message
    }); 
  }
};

export const handleDeleteAccount = async (req: Request, res: Response) => {
  try {
    // 1. Terminate Supabase Auth Identity (Prevent Ghost Accounts)
    console.log(`[AUTH DELETE] Terminating Supabase identity for: ${req.userId}`);
    const supabaseAdmin = getSupabaseAdmin();
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(req.userId!);
    
    if (authError) {
      console.error("[AUTH DELETE] Supabase Deletion Failed:", authError.message);
      // We continue to local deletion to ensure local data is also wiped if possible
    }

    // 2. Local Data Purge (CASCADE handles associated nodes)
    await query("DELETE FROM dim_users WHERE user_id = $1", [req.userId]);
    
    res.json({ message: "Account successfully terminated." });
  } catch (err: any) { 
    const isProd = process.env.NODE_ENV === "production";
    res.status(500).json({ 
      message: "Termination error.",
      detail: isProd ? "Account purge incomplete." : err.message
    }); 
  }
};

// Route Definitions
router.post("/login", authLimiter, handleLogin as any);
router.post("/signup", authLimiter, handleSignup as any);
router.post("/guest", authLimiter, handleGuestSignup as any);
router.get("/me", requireAuth, handleMe as any);
router.patch("/update", requireAuth, handleUpdateProfile as any);
router.delete("/delete", requireAuth, handleDeleteAccount as any);

export default router;