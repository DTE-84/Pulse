import "dotenv/config";
import express from "express";
import cors from "cors";

// 1. Lazy-loaded routes to prevent boot crashes
const handleDemo = (req: any, res: any) => import("./routes/demo").then(m => m.handleDemo(req, res));
const handleStats = (req: any, res: any) => import("./routes/stats").then(m => m.handleStats(req, res));
const handleLogin = (req: any, res: any) => import("./routes/auth").then(m => m.handleLogin(req, res));
const handleSignup = (req: any, res: any) => import("./routes/auth").then(m => m.handleSignup(req, res));
const handleMe = (req: any, res: any) => import("./routes/auth").then(m => m.handleMe(req, res));
const handleUpdateProfile = (req: any, res: any) => import("./routes/auth").then(m => m.handleUpdateProfile(req, res));
const handleIngest = (req: any, res: any) => import("./routes/ingest").then(m => m.handleIngest(req, res));
const handleNovaChat = (req: any, res: any) => import("./routes/chat").then(m => m.handleNovaChat(req, res));
const handleAnalysis = (req: any, res: any) => import("./routes/analysis").then(m => m.handleAnalysis(req, res));
const handleGetGoals = (req: any, res: any) => import("./routes/goals").then(m => m.handleGetGoals(req, res));
const handleCreateGoal = (req: any, res: any) => import("./routes/goals").then(m => m.handleCreateGoal(req, res));

// 2. Middleware (Pre-loaded as they are lightweight)
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

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // Routes
  app.get("/api/ping", (_req, res) => res.json({ message: "ping" }));
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

  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error("[PULSE SERVER ERROR]:", err);
    res.status(500).json({ message: "Internal server error", detail: err.message });
  });

  return app;
}
