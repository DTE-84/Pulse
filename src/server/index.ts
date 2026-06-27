import express from "express";
import cors from "cors";
import { query } from "./db/db.js";

// 1. Direct Imports for Core Routes (Eliminate lazy-load bundling issues)
import { handleDemo } from "./routes/demo.js";
import { handleStats } from "./routes/stats.js";
import authRouter, { handleDebug } from "./routes/auth.js";
import { handleIngest } from "./routes/ingest.js";
import { handleNovaChat } from "./routes/chat.js";
import { handleAnalysis } from "./routes/analysis.js";
import { handleGetTransactions } from "./routes/transactions.js";
import { handleGetGoals, handleCreateGoal } from "./routes/goals.js";
import { handleStripeWebhook } from "./routes/webhooks.js";
import { createCheckoutSession } from "./routes/payments.js";
import { 
  createLinkToken, 
  exchangePublicToken, 
  sandboxSeed 
} from "./routes/plaid.js";
import handleCronGenerateTransactions from "../../api/cron/generate-transactions.js";

// 2. Middleware
import {
  securityHeaders,
  requireAuth,
  ingestLimiter,
  apiLimiter,
} from "./middleware/security.js";


export function createServer() {
  const app = express();

  app.use(securityHeaders);

  app.use(cors({
    origin: (origin: string | undefined, cb: Function) => {
      // TEMPORARY: Allow all origins during guest debug phase
      if (!origin || origin.includes("localhost") || origin.includes("vercel.app") || origin.includes("dte-solutions.icu")) {
         return cb(null, true);
      }
      
      console.warn(`[PULSE CORS] Checking Origin: ${origin}`);
      cb(null, true); 
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  }));

  // Stripe Webhook needs raw body before express.json()
  app.post("/api/webhooks/stripe", express.raw({ type: 'application/json' }), handleStripeWebhook as any);

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // 3. Security-Gated Diagnostic Nodes (Development Only)
  if (process.env.NODE_ENV !== "production") {
    app.get("/api/debug/system", requireAuth, handleDebug as any);
    app.get("/api/diagnostic", requireAuth, (req, res) => {
      res.json({
        url: req.url,
        path: req.path,
        env: {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL: process.env.VERCEL,
          HAS_DB: !!process.env.DATABASE_URL,
          HAS_JWT: !!process.env.JWT_SECRET
        }
      });
    });
  }

  app.get("/api/ping", (_req, res) => res.json({ message: "ping", status: "Deterministic Uplink Active" }));
  app.get("/api/health", async (_req, res) => {
    try {
      await query("SELECT NOW()");
      res.json({ 
        status: "Online", 
        message: "Pulse Nexus Operational", 
        database: "Connected",
        timestamp: new Date().toISOString() 
      });
    } catch (err: any) {
      res.status(500).json({ 
        status: "Degraded", 
        message: "Database Uplink Interrupted", 
        error: err.message,
        timestamp: new Date().toISOString() 
      });
    }
  });

  // Financial Uplink Routes
  app.post("/api/payments/create-session", requireAuth, createCheckoutSession as any);
  app.post("/api/plaid/create-link-token", requireAuth, createLinkToken as any);
  app.post("/api/plaid/exchange-token", requireAuth, exchangePublicToken as any);
  app.post("/api/plaid/sandbox-seed", requireAuth, sandboxSeed as any);
  app.get("/api/cron/generate-transactions", handleCronGenerateTransactions as any);
  app.post("/api/cron/generate-transactions", handleCronGenerateTransactions as any);

  app.get("/api/demo", apiLimiter, handleDemo as any);
  app.get("/api/stats", apiLimiter, requireAuth, handleStats as any);
  app.post("/api/nova/chat", apiLimiter, requireAuth, handleNovaChat as any);
  app.post("/api/nova/analysis", apiLimiter, requireAuth, handleAnalysis as any);
  app.get("/api/finance/goals", apiLimiter, requireAuth, handleGetGoals as any);
  app.post("/api/finance/goals", apiLimiter, requireAuth, handleCreateGoal as any);
  app.get("/api/finance/transactions", apiLimiter, requireAuth, handleGetTransactions as any);
  app.post("/api/finance/ingest", ingestLimiter, requireAuth, handleIngest as any);

  // Unified Auth Nexus
  app.use("/api/auth", authRouter);

  // Catch-all for undefined API routes
  app.all("/api/{*path}", (req, res) => {
    console.warn(`[PULSE API 404] No match for: ${req.method} ${req.path}`);
    res.status(404).json({
      error: "API endpoint not found (Express)",
      path: req.path,
      method: req.method
    });
  });

  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error("[PULSE SERVER CRASH]:", err.message, err.stack);

    res.status(err.status || 500).json({ 
      message: "Nova Uplink Interrupted", 
      detail: err.message,
      stack: err.stack,
      code: err.code || "INTERNAL_ERROR",
      hint: "Exposing stack trace for immediate production debugging."
    });
  });

  return app;
}

const app = createServer();
export default app;
