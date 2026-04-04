import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  root: "src/client", // Set the project root for Vite
  plugins: [react()],
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src/client"),
    },
  },
  server: {
    proxy: {
      "/Pulse/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/Pulse/, ""),
        secure: false,
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../client"),
    emptyOutDir: true,
  },
});
