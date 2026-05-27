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
const distPath = path.resolve(__dirname, "..");

// Serve static files at the base path (/Pulse)
app.use("/Pulse/assets", express.static(path.join(distPath, "assets"), {
  immutable: true,
  maxAge: "1y",
  fallthrough: false
}));

app.use("/Pulse", express.static(distPath));

// Handle React Router - serve index.html for all non-API routes
app.use((req: any, res: any) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  // If the path starts with /Pulse, serve the index.html from dist/spa
  if (req.path.startsWith("/Pulse")) {
    return res.sendFile(path.join(distPath, "index.html"));
  }

  // Redirect root to /Pulse for UX consistency
  if (req.path === "/") {
    return res.redirect("/Pulse/");
  }

  res.status(404).json({ error: "Not found" });
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
