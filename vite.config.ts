import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  base: "/Pulse/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
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
    outDir: "dist/spa",

    rollupOptions: {
      input: path.resolve(__dirname, "index.html"),
    },
  },
});
