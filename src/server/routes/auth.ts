import { Request, Response, Router } from "express";
import crypto from "crypto";
import { query } from "../db/db.js";
import { seedGuestData } from "../db/seed-guest.js";
import { setupTrialSandboxItem } from "../lib/plaid.js";
import { getSupabase, getSupabaseAdmin, authLimiter, requireAuth } from "../middleware/security.js";

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
  const { email, password } = req.body;
  const err = validateAuthInput(email, password);
  if (err) return res.status(400).json({ message: err });

  try {
    console.log(`[AUTH LOGIN] Attempting Supabase login for: ${email}`);
    
    const supabaseAdmin = getSupabaseAdmin();
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.warn(`[AUTH LOGIN] Failed login for: ${email} - ${authError.message}`);
      return res.status(401).json({ 
        message: authError.message.includes("Email not confirmed") 
          ? "Please verify your email before logging in." 
          : "Invalid credentials." 
      });
    }

    const session = authData.session;
    const user = authData.user;
    if (!session || !user) throw new Error("Authentication failed.");

    // Fetch profile from dim_users
    const result = await query(
      "SELECT user_id, user_name, email, baseline_spend, nova_tone, onboarding_completed, is_demo, subscription_status, trial_ends_at FROM dim_users WHERE user_id = $1",
      [user.id]
    );
    const profile = result.rows[0];

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
    const isProd = process.env.NODE_ENV === "production";
    console.error("[AUTH LOGIN] General Error:", e.message);
    res.status(500).json({ 
      message: "Authentication error.", 
      detail: isProd ? "Uplink failed." : e.message 
    });
  }
};

export const handleSignup = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
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
  console.log("[PULSE AUTH] Initializing Guest Sandbox Protocol...");
  const sUrl = process.env.VITE_SUPABASE_URL;
  const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log(`[PULSE AUTH] Diagnostics - URL: ${sUrl ? "OK" : "MISSING"}, Key: ${sKey ? "OK" : "MISSING"}`);
  
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
       console.error("[PULSE AUTH] FATAL: supabaseAdmin is null or undefined");
       throw new Error("Supabase Admin client initialization failed.");
    }

    // Use crypto for higher entropy and collision avoidance
    const guestId = crypto.randomBytes(4).toString('hex'); 
    const email = `guest_${guestId}@pulse.demo`;
    const password = crypto.randomBytes(12).toString('base64') + "A1!"; 
    const name = `Guest User ${guestId.toUpperCase()}`;

    console.log(`[PULSE AUTH] Provisioning Supabase Auth identity: ${email}`);

    // 1. Create User in Supabase Auth
    let { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    // Handle potential "unexpected_failure" by checking if user was actually created
    if (authError && authError.status === 500) {
      console.warn("[PULSE AUTH] Received 500 from Supabase, checking if user exists anyway...");
      const { data: searchData } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = searchData?.users.find((u: any) => u.email === email);
      if (existingUser) {
        console.log("[PULSE AUTH] User was successfully created despite 500 error.");
        authData = { user: existingUser as any };
        authError = null;
      }
    }

    if (authError) {
      console.error("[PULSE AUTH] Supabase Auth Creation Failed:", JSON.stringify(authError, Object.getOwnPropertyNames(authError)));
      return res.status(500).json({ 
        message: "Sandbox Identity Failure", 
        detail: authError.message || "Unexpected Supabase Error",
        code: authError.status || 500
      });
    }

    const user = authData.user;
    if (!user) {
        console.error("[PULSE AUTH] Auth successful but user object is missing");
        throw new Error("User creation succeeded but no user object returned.");
    }
    console.log(`[PULSE AUTH] Identity confirmed: ${user.id}`);

    // 2. Update the profile created by the trigger
    console.log("[PULSE AUTH] Refining demo profile...");
    const { error: profileError } = await supabaseAdmin
      .from("dim_users")
      .update({
        is_demo: true,
        subscription_status: 'trialing',
        subscription_tier: 'trial',
        trial_started_at: new Date().toISOString(),
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        plaid_env: process.env.PLAID_ENV || 'sandbox',
        onboarding_completed: true 
      })
      .eq("user_id", user.id);

    if (profileError) {
      console.warn("[PULSE AUTH] Profile refinement failed, attempting upsert:", profileError.message);
      const { error: upsertError } = await supabaseAdmin.from("dim_users").upsert([{
        user_id: user.id,
        user_name: name,
        email: email,
        is_demo: true,
        subscription_status: 'trialing',
        subscription_tier: 'trial',
        trial_started_at: new Date().toISOString(),
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        plaid_env: process.env.PLAID_ENV || 'sandbox',
        onboarding_completed: true
      }]);
      
      if (upsertError) {
          console.error("[PULSE AUTH] Upsert also failed:", upsertError.message);
      }
    }

    // 3. High-Fidelity Signal Seeding
    try {
      console.log("[PULSE AUTH] Injecting behavioral signals...");
      await seedGuestData(user.id);
      
      // Auto-Provision Plaid Sandbox for Zero-Friction Demo
      console.log("[PULSE AUTH] Provisioning sandbox bank uplink...");
      await setupTrialSandboxItem(user.id);
    } catch (seedErr: any) {
      console.warn("[PULSE AUTH] Signal/Bank seeding interrupted:", seedErr.message);
    }

    // 4. Generate REAL Supabase Session for the Guest
    console.log("[PULSE AUTH] Generating Supabase session...");
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (sessionError || !sessionData.session) {
      console.error("[PULSE AUTH] Session Generation Failed:", sessionError?.message || "No session data");
      return res.status(500).json({ 
        message: "Session Uplink Failed", 
        detail: sessionError?.message || "Supabase did not return a session for the guest. Identity provisioning may have timed out.",
        hint: "This often occurs if project configuration or database migrations are incomplete."
      });
    }

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
  } catch (err: any) {
    const isProd = process.env.NODE_ENV === "production";
    console.error("[PULSE AUTH] FATAL General Failure:", err.message);
    res.status(500).json({ 
      message: "Guest Protocol Failure", 
      detail: isProd ? "Sandbox initializing error." : err.message
    });
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