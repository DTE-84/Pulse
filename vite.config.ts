// vite.config.ts  (copy‑paste)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

export default defineConfig({
  base: "/PULSE-AI NOVA FINANCE APP", // <-- edit ONLY if you need a trailing slash
  plugins: [
    react(),
    {
      name: "vite-express-middleware",
      apply: "serve",
      configureServer(server) {
        const app = createServer();
        server.middlewares.use(app);
        console.log("[Vite] Express dev server attached");
      },
    },
  ],
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["/", "./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
    clean: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  proxy: {
    "/api": {
      target: "http://localhost:3000",
      changeOrigin: true,
      secure: false,
      // rewrite: (path) => path.replace(/^\/api/, ""),
    },
  },
});
