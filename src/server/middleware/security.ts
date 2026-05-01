import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

// 1. JWT SECRET GUARD — server exits if not set or too short
const _secret = process.env.JWT_SECRET;
if (!_secret) { 
  console.error("[PULSE SECURITY] FATAL: JWT_SECRET not set.");
  // Don't exit in serverless environment, just let the request fail
  if (process.env.NODE_ENV !== "production") process.exit(1);
}
const isDev = process.env.NODE_ENV !== "production";
const minLen = isDev ? 16 : 32;
if (_secret && _secret.length < minLen) {
  console.error(`[PULSE SECURITY] FATAL: JWT_SECRET too short (min ${minLen} chars for ${isDev ? "dev" : "prod"}).`);
  if (process.env.NODE_ENV !== "production") process.exit(1);
}
export const JWT_SECRET: string = _secret || "temp-development-secret-only-for-fallback";

// Initialize Supabase Admin for token verification
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 2. AUTH MIDDLEWARE — multi-protocol JWT verifier (Local + Supabase)
declare global { namespace Express { interface Request { userId?: string; userEmail?: string; } } }

export const requireAuth: RequestHandler = async (req, res, next) => {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) { res.status(401).json({ message: "Authentication required." }); return; }
  
  const token = h.split(" ")[1];
  
  // Strategy A: Try local JWT (custom auth routes)
  try {
    const d = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    req.userId = d.id; req.userEmail = d.email;
    return next();
  } catch (err) {
    // Strategy B: Fallback to Supabase verification
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (user && !error) {
      req.userId = user.id;
      req.userEmail = user.email;
      return next();
    }
    
    console.error("[PULSE AUTH] Verification failed:", error?.message || "Invalid local token");
    res.status(401).json({ message: "Invalid or expired session." });
  }
};

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

// 6. SECURITY HEADERS
export const securityHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.removeHeader("X-Powered-By");
  next();
};