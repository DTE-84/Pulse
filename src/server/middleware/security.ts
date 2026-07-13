import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

// 1. JWT SECRET GUARD — server crashes if not set (Deterministic Security)
export const JWT_SECRET: string = (() => {
  const secret = process.env.JWT_SECRET;
  const isProd = process.env.NODE_ENV === "production";
  const minLen = isProd ? 32 : 16;

  if (!secret) {
    throw new Error("FATAL: JWT_SECRET environment variable is missing.");
  }
  if (secret.length < minLen) {
    throw new Error(`FATAL: JWT_SECRET is too short for ${process.env.NODE_ENV} node.`);
  }
  return secret;
})();

// Initialize Supabase Admin for token verification
let _supabase: any;

export function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!_supabase) {
    if (!url || !key) {
      throw new Error("FATAL: Supabase Client credentials (URL/ANON_KEY) missing from environment.");
    }
    _supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
  }
  return _supabase;
}

// Initialize Supabase Admin (RLS Bypass)
let _supabaseAdmin: any;

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!_supabaseAdmin) {
    if (!url || !serviceRoleKey) {
      throw new Error("FATAL: Supabase Admin credentials (URL/SERVICE_ROLE) missing from environment.");
    }
    _supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return _supabaseAdmin;
}

// 2. AUTH MIDDLEWARE — multi-protocol JWT verifier (Local + Supabase)
declare global { namespace Express { interface Request { userId?: string; userEmail?: string; userRole?: string; } } }

import { query } from "../db/db.js";

export const requireAuth: RequestHandler = async (req, res, next) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) { res.status(401).json({ message: "Authentication required." }); return; }
  
  const token = h.split(" ")[1];
  
  // Strategy A: Try local JWT (custom auth routes)
  let resolvedUserId: string | undefined;
  let resolvedUserEmail: string | undefined;

  try {
    const d = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    resolvedUserId = d.id;
    resolvedUserEmail = d.email;
  } catch (err) {
    // Strategy B: Fallback to Supabase verification
    try {
      const supabase = getSupabase();
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (user && !error) {
        resolvedUserId = user.id;
        resolvedUserEmail = user.email;
      }
    } catch (sErr: any) {
      console.error("[PULSE AUTH] Supabase client error:", sErr.message);
    }
  }

  if (resolvedUserId) {
    req.userId = resolvedUserId;
    req.userEmail = resolvedUserEmail;
    
    // Optionally fetch the role to attach to the request
    try {
      const dbRes = await query("SELECT system_role FROM dim_users WHERE user_id = $1", [resolvedUserId]);
      if (dbRes.rows.length > 0) {
        req.userRole = dbRes.rows[0].system_role;
      }
    } catch (dbErr) {
      // ignore
    }
    return next();
  }
    
  res.status(401).json({ message: "Invalid or expired session." });
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ message: "Access Denied: Insufficient role privileges." });
    }
    return next();
  };
};

export async function logAuditAction(userId: string, action: string, ipAddress: string, details: any = {}) {
  try {
    await query(
      "INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES ($1, $2, $3, $4)",
      [userId, action, ipAddress, JSON.stringify(details)]
    );
  } catch (err: any) {
    console.error("[PULSE AUDIT] Failed to log action:", err.message);
  }
}

// 3. RATE LIMITER — in-memory, no external package needed
interface RLE { count: number; resetAt: number; }
const rlStore = new Map<string, RLE>();
setInterval(() => { const n = Date.now(); rlStore.forEach((e,k) => { if (n > e.resetAt) rlStore.delete(k); }); }, 600000);

export function createRateLimiter(o: { windowMs: number; max: number; message?: string; }): RequestHandler {
  return (req, res, next) => {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "?";
    const key = req.path + ":" + ip, now = Date.now(), e = rlStore.get(key);
    if (!e || now > e.resetAt) { rlStore.set(key, { count: 1, resetAt: now + o.windowMs }); return next(); }
    if (e.count >= o.max) {
      const s = Math.ceil((e.resetAt - now) / 1000);
      res.setHeader("Retry-After", s);
      res.status(429).json({ message: o.message || "Too many requests.", retryAfterSeconds: s }); return;
    }
    e.count++; next();
  };
}
export const authLimiter = createRateLimiter({ windowMs: 900000, max: 10, message: "Too many auth attempts. Wait 15 min." });
export const ingestLimiter = createRateLimiter({ windowMs: 60000, max: 30, message: "Ingest rate limit reached." });
export const apiLimiter = createRateLimiter({ windowMs: 60000, max: 120, message: "API rate limit reached." });

// 4. CSV SANITIZER — strip injection vectors before wrangler
export function sanitizeCsvField(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).replace(/[\r\n]+/g, " ").replace(/,/g, "").replace(/"/g, "'").replace(/`/g, "").trim().slice(0, 255);
}

// 5. TRANSACTION VALIDATOR — shape + type check before DB write
const VALID_RISK = ["Essential", "Lifestyle", "Impulse", "Critical"];
export function validateTransaction(t: unknown): string | null {
  if (typeof t !== "object" || t === null) return "Transaction must be an object.";
  const tx = t as Record<string, unknown>;
  if (typeof tx.date !== "string" || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(tx.date)) return "date must be YYYY-MM-DD.";
  const amt = Number(tx.amount);
  if (isNaN(amt) || amt <= 0 || amt > 1000000) return "amount must be positive and not exceed 1,000,000.";
  if (typeof tx.category !== "string" || !tx.category.trim()) return "category must be a non-empty string.";
  if (tx.risk_category !== undefined && !VALID_RISK.includes(tx.risk_category as string))
    return "risk_category must be: Essential, Lifestyle, Impulse, or Critical.";
  return null;
}

// 6. TRIAL GATE LOGIC
export function isTrialActive(user: { subscription_status: string, trial_ends_at: string | Date }) {
  if (user.subscription_status === 'active') return false; // Active paid users skip trial logic
  return new Date() < new Date(user.trial_ends_at);
}

// 7. SECURITY HEADERS
export const securityHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.removeHeader("X-Powered-By");
  next();
};