import express from "express";
import cors from "cors";

// 1. Direct Imports for Core Routes (Eliminate lazy-load bundling issues)
import { handleDemo } from "./routes/demo.js";
import { handleStats } from "./routes/stats.js";
import authRouter, { handleDebug } from "./routes/auth.js";
import { handleIngest } from "./routes/ingest.js";
import { handleNovaChat } from "./routes/chat.js";
import { handleAnalysis } from "./routes/analysis.js";
import { handleGetGoals, handleCreateGoal } from "./routes/goals.js";
import { handleStripeWebhook } from "./routes/webhooks.js";
import { createCheckoutSession } from "./routes/payments.js";
import { createLinkToken, exchangePublicToken } from "./routes/plaid.js";

// 2. Middleware
import {
  securityHeaders,
  requireAuth,
  ingestLimiter,
  apiLimiter,
} from "./middleware/security.js";

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:3000,https://pulse-nova-solutions.vercel.app,https://dte-solutions.icu")
  .split(",").map((o: string) => o.trim());

export function createServer() {
  const app = express();

  app.use(securityHeaders);

  app.use(cors({
    origin: (origin: string | undefined, cb: Function) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return cb(null, true);

      const isAllowed = 
        ALLOWED_ORIGINS.includes(origin) || 
        ALLOWED_ORIGINS.includes(origin + "/") ||
        origin.endsWith(".vercel.app") || 
        origin.includes("dte-solutions.icu") ||
        origin.includes("localhost");

      if (isAllowed) {
        cb(null, true);
      } else {
        console.warn(`[PULSE CORS] Unauthorized Origin: ${origin}`);
        // In development, we might want to be more lax, but in prod we restrict.
        // For debugging, we return the error which will show up in the console.
        cb(new Error(`CORS: Origin ${origin} not permitted.`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  }));

  // Stripe Webhook needs raw body before express.json()
  app.post("/api/webhooks/stripe", express.raw({ type: 'application/json' }), handleStripeWebhook as any);

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // High-Fidelity Diagnostic Node (Priority Alpha)
  app.get("/api/debug/system", cors() as any, handleDebug as any);
  app.get("/api/ping", (_req, res) => res.json({ message: "ping", status: "Deterministic Uplink Active" }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok", message: "Pulse API is healthy", timestamp: new Date().toISOString() }));
  
  app.get("/api/diagnostic", (req, res) => {
    res.json({
      url: req.url,
      path: req.path,
      headers: {
        host: req.headers.host,
        origin: req.headers.origin,
        referer: req.headers.referer
      },
      env: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        HAS_DB: !!process.env.DATABASE_URL,
        HAS_JWT: !!process.env.JWT_SECRET
      }
    });
  });

  // Financial Uplink Routes
  app.post("/api/payments/create-session", requireAuth, createCheckoutSession as any);
  app.post("/api/plaid/create-link-token", requireAuth, createLinkToken as any);
  app.post("/api/plaid/exchange-token", requireAuth, exchangePublicToken as any);

  app.get("/api/demo", handleDemo as any);
  app.get("/api/stats", apiLimiter, requireAuth, handleStats as any);
  app.post("/api/nova/chat", apiLimiter, requireAuth, handleNovaChat as any);
  app.post("/api/nova/analysis", apiLimiter, requireAuth, handleAnalysis as any);
  app.get("/api/finance/goals", apiLimiter, requireAuth, handleGetGoals as any);
  app.post("/api/finance/goals", apiLimiter, requireAuth, handleCreateGoal as any);
  app.post("/api/finance/ingest", ingestLimiter, requireAuth, handleIngest as any);

  // Unified Auth Nexus
  app.use("/api/auth", authRouter);

  // Catch-all for undefined API routes (Distinguish from Vercel 404)
  app.all("/api/*", (req, res) => {
    console.warn(`[PULSE API 404] No match for: ${req.method} ${req.path}`);
    res.status(404).json({
      error: "API endpoint not found (Express)",
      path: req.path,
      method: req.method
    });
  });

  app.use((err: any, req: any, res: any, _next: any) => {
    const isProd = process.env.NODE_ENV === "production";
    console.error("[PULSE SERVER CRASH]:", err.message);
    
    // Ensure CORS headers are present even on error responses
    const origin = req.headers.origin;
    if (origin && (ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".vercel.app") || origin.includes("dte-solutions.icu"))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    res.status(err.status || 500).json({ 
      message: "Nova Uplink Interrupted", 
      detail: isProd ? "Internal Signal Error. Our engineers have been alerted." : err.message,
      code: err.code || "INTERNAL_ERROR"
    });
  });

  return app;
}

const app = createServer();
export default app;
