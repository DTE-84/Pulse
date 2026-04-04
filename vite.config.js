import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Setting the root to the client folder prevents Vite from getting lost
  root: "src/client",
  plugins: [react()],
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src/client"),
    },
  },
  build: {
    // Go up from src/client to the project root's dist folder
    outDir: "../../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        // Use pathToFileURL to ensure Windows backslashes are preserved
        main: pathToFileURL(path.resolve(__dirname, "src/client/index.html")).href,
      },
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
  }
});
