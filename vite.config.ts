// vite.config.ts  (copy‑paste)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";






export default defineConfig({
  plugins: [react()],
  base: '/Pulse/',
  resolve: {
    alias: {
     
      "@": path.resolve(__dirname, "./client"),
    },
  },
  server: { 
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
    fs: {
      allow: [".", "./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
      /* 
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name][extname]",
      },
      */
    },
      },
    },
 
);
