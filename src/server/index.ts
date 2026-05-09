import "dotenv/config";
import express from "express";
import cors from "cors";

// 1. Direct Imports for Core Routes (Eliminate lazy-load bundling issues)
import { handleDemo } from "./routes/demo";
import { handleStats } from "./routes/stats";
import { handleLogin, handleSignup, handleMe, handleUpdateProfile, handleDeleteAccount } from "./routes/auth";
import { handleIngest } from "./routes/ingest";
import { handleNovaChat } from "./routes/chat";
import { handleAnalysis } from "./routes/analysis";
import { handleGetGoals, handleCreateGoal } from "./routes/goals";
import { handleStripeWebhook } from "./routes/webhooks";

// 2. Middleware
import {
  securityHeaders,
  requireAuth,
  authLimiter,
  ingestLimiter,
  apiLimiter,
} from "./middleware/security";

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:3000,https://pulse-nova-solutions.vercel.app,https://dte-solutions.icu")
  .split(",").map((o: string) => o.trim());

export function createServer() {
  const app = express();

  app.use(securityHeaders);

  app.use(cors({
    origin: (origin: string | undefined, cb: Function) => {
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      if (origin.endsWith(".vercel.app")) return cb(null, true);
      cb(new Error(`CORS: Origin ${origin} not permitted.`));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));

  // Stripe Webhook needs raw body before express.json()
  app.post("/api/webhooks/stripe", express.raw({ type: 'application/json' }), handleStripeWebhook as any);

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // High-Fidelity Routing Table
  app.get("/api/ping", (_req, res) => res.json({ message: "ping", status: "Deterministic Uplink Active" }));
  app.get("/api/demo", handleDemo as any);
  app.get("/api/stats", apiLimiter, requireAuth, handleStats as any);
  app.post("/api/nova/chat", apiLimiter, requireAuth, handleNovaChat as any);
  app.post("/api/nova/analysis", apiLimiter, requireAuth, handleAnalysis as any);
  app.get("/api/finance/goals", apiLimiter, requireAuth, handleGetGoals as any);
  app.post("/api/finance/goals", apiLimiter, requireAuth, handleCreateGoal as any);
  app.post("/api/finance/ingest", ingestLimiter, requireAuth, handleIngest as any);
  app.post("/api/auth/login", authLimiter, handleLogin as any);
  app.post("/api/auth/signup", authLimiter, handleSignup as any);
  app.get("/api/auth/me", requireAuth, handleMe as any);
  app.patch("/api/auth/update", requireAuth, handleUpdateProfile as any);
  app.delete("/api/auth/delete", requireAuth, handleDeleteAccount as any);

  // Diagnostic Endpoint (Internal Security Node)
  app.get("/api/debug/system", requireAuth, async (req, res) => {
    res.json({
      userId: req.userId,
      env: {
        has_gemini_key: !!process.env.GOOGLE_GENAI_API_KEY,
        has_supabase_url: !!process.env.VITE_SUPABASE_URL,
        node_env: process.env.NODE_ENV
      },
      timestamp: new Date().toISOString()
    });
  });

  app.use((err: any, _req: any, res: any, _next: any) => {
    const isProd = process.env.NODE_ENV === "production";
    console.error("[PULSE SERVER CRASH]:", err.message);
    
    res.status(err.status || 500).json({ 
      message: "Nova Uplink Interrupted", 
      detail: isProd ? "Internal Signal Error. Our engineers have been alerted." : err.message,
      code: err.code || "INTERNAL_ERROR"
    });
  });

  return app;
}
