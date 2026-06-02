import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "./index";
import * as express from "express";

const app = createServer();
const port = process.env.PORT || 3000;

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In production, serve the built SPA files
const distPath = path.resolve(__dirname, "..", "..", "dist");

// Serve assets from both root and /Pulse for compatibility
app.use("/assets", express.static(path.join(distPath, "assets"), {
  immutable: true,
  maxAge: "1y",
  fallthrough: true
}));

app.use("/Pulse/assets", express.static(path.join(distPath, "assets"), {
  immutable: true,
  maxAge: "1y",
  fallthrough: true
}));

// Serve static files (icons, manifest, etc.)
app.use(express.static(distPath));
app.use("/Pulse", express.static(distPath));

// Handle React Router - serve index.html for all non-API routes
app.use((req: any, res: any) => {
  const isApi = req.path.startsWith("/api/");

  // Don't serve index.html for API routes
  if (isApi || req.path.startsWith("/health")) {
    console.log(`[PULSE 404] API route not found: ${req.path}`);
    return res.status(404).json({
      error: "API endpoint not found",
      path: req.path
    });
  }

  // Support for specific asset requests
  if (req.path.startsWith("/assets/")) {
     return res.sendFile(path.join(distPath, req.path));
  }

  // Catch-all: serve index.html
  res.sendFile(path.join(distPath, "index.html"));
});

// Only listen if not in a Vercel environment
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`🚀 Fusion Starter server running on port ${port}`);
    console.log(`📱 Frontend: http://localhost:${port}`);
    console.log(`🔧 API: http://localhost:${port}/api`);
  });
}

export default app;

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
