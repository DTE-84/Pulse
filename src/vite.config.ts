import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react-swc";

// __dirname is C:\Users\drewt\dtedev\PulseAi-Prod\src
export default defineConfig({
  // Set Vite's root to src/client where the source index.html resides.
  root: path.resolve(__dirname, "client"),
  publicDir: path.resolve(__dirname, "../public"),

  plugins: [react()],
  base: "/", // Root base for Vercel

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client"),
    },
  },
  build: {
    // outDir is relative to root, so go up from src/client to repo root /dist
    outDir: path.resolve(__dirname, "../dist"),
    emptyOutDir: true,
  },
});
