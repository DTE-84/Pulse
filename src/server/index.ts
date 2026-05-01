import "dotenv/config";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const express = require("express");
const cors = require("cors");

import { handleDemo } from "./routes/demo";
import { handleStats } from "./routes/stats";
import { handleLogin, handleSignup, handleMe, handleUpdateProfile } from "./routes/auth";
import { handleIngest } from "./routes/ingest";
import { handleNovaChat } from "./routes/chat";
import { handleAnalysis } from "./routes/analysis";
import { handleGetGoals, handleCreateGoal } from "./routes/goals";
import {
  securityHeaders,
  requireAuth,
  authLimiter,
  ingestLimiter,
  apiLimiter,
} from "./middleware/security";

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

      cb(new Error(`CORS: Origin ${origin} not permitted.`));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));

  app.use(express.json({ limit: "1mb" })); // cap payload size
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  app.get("/api/ping", (_req: any, res: any) => res.json({ message: process.env.PING_MESSAGE ?? "ping" }));
  app.get("/api/demo", handleDemo);

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
    const status = err.message?.includes("CORS") ? 403 : 500;
    res.status(status).json({
      message: "Internal server error",
      detail: process.env.NODE_ENV === "production" ? "Check server logs for details." : err.message,
    });
  });

  return app;
}