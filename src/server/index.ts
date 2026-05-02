import "dotenv/config";
import express from "express";
import cors from "cors";

// Static imports for routes
import { handleDemo } from "./routes/demo.js";
import { handleStats } from "./routes/stats.js";
import { handleLogin, handleSignup, handleMe, handleUpdateProfile } from "./routes/auth.js";
import { handleIngest } from "./routes/ingest.js";
import { handleNovaChat } from "./routes/chat.js";
import { handleAnalysis } from "./routes/analysis.js";
import { handleGetGoals, handleCreateGoal } from "./routes/goals.js";

// Static imports for middleware
import {
  securityHeaders,
  requireAuth,
  authLimiter,
  ingestLimiter,
  apiLimiter,
} from "./middleware/security.js";

// Allowed origins — add your production domain here
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:3000,https://pulse-nova-solutions.vercel.app,https://dte-solutions.icu")
  .split(",").map((o: string) => o.trim());

export function createServer() {
  const app = express();

  app.use(securityHeaders);

  app.use(cors({
    origin: (origin: string | undefined, cb: Function) => {
      // 1. Allow if no origin (e.g. server-to-server or same-origin on some browsers)
      if (!origin) return cb(null, true);
      
      // 2. Allow if in explicit list
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      
      // 3. Allow any Vercel domain in production for flexibility (optional but helpful)
      if (origin.endsWith(".vercel.app")) return cb(null, true);

      cb(null, true); // Fallback: allow for debugging, can tighten later
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));

  app.use(express.json({ limit: "1mb" })); // cap payload size
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  app.get("/api/ping", (_req, res) => res.json({ message: process.env.PING_MESSAGE ?? "ping" }));
  app.get("/api/demo", handleDemo);

  // Diagnostics
  app.get("/api/health", async (_req, res) => {
    const health: any = { 
      status: "running", 
      env: { 
        node_env: process.env.NODE_ENV,
        has_db: !!process.env.DATABASE_URL,
        has_ai: !!process.env.GOOGLE_GENAI_API_KEY,
        has_jwt: !!process.env.JWT_SECRET
      },
      checks: {} 
    };
    try {
      const { query } = await import("./db/db.js");
      await query("SELECT 1");
      health.checks.database = "connected";
    } catch (e: any) {
      health.checks.database = "error: " + e.message;
      health.status = "degraded";
    }
    res.json(health);
  });

  app.get("/api/test-ai", async (_req, res) => {
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || "");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent("System health check. Reply with 'OK'.");
      res.json({ message: "AI Response Received", response: result.response.text() });
    } catch (e: any) {
      console.error("[DIAGNOSTIC AI ERROR]:", e);
      res.status(500).json({ 
        error: "AI diagnostic failed", 
        detail: e.message,
        hint: "Check GOOGLE_GENAI_API_KEY in Vercel settings."
      });
    }
  });

  // Stats — authenticated + rate-limited
  app.get("/api/stats", apiLimiter, requireAuth, handleStats);

  // AI Chat — authenticated + rate-limited
  app.post("/api/nova/chat", apiLimiter, requireAuth, handleNovaChat);

  // AI Analysis — authenticated + rate-limited
  app.post("/api/nova/analysis", apiLimiter, requireAuth, handleAnalysis);

  // Goals
  app.get("/api/finance/goals", apiLimiter, requireAuth, handleGetGoals);
  app.post("/api/finance/goals", apiLimiter, requireAuth, handleCreateGoal);

  // Ingest — authenticated + stricter rate limit
  app.post("/api/finance/ingest", ingestLimiter, requireAuth, handleIngest);

  // Auth routes — rate-limited to block brute force
  app.post("/api/auth/login", authLimiter, handleLogin);
  app.post("/api/auth/signup", authLimiter, handleSignup);
  app.get("/api/auth/me", requireAuth, handleMe);
  app.patch("/api/auth/update", requireAuth, handleUpdateProfile);

  // Global Error Handler
  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error("[PULSE SERVER ERROR]:", err);
    res.status(500).json({
      message: "Internal server error",
      detail: err.message || "Unknown error occurred",
    });
  });

  return app;
}