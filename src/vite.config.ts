import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react-swc";

// __dirname is C:\Users\drewt\dtedev\PulseAi-Prod\src\client
const projectRoot = path.resolve(__dirname, "../.."); // project_root

export default defineConfig({
  // Set Vite's root to src/client, where index.html and vite.config.ts reside.
  root: path.resolve(__dirname, ".."), // This resolves to project_root/src/client

  plugins: [react()],
    base: "/Pulse/", // Set base path for assets

  resolve: {
    alias: {
      // Alias should now resolve to the root of the application within Vite's context (src/client).
      "@": path.resolve(__dirname), // Alias points to the directory containing vite.config.ts
    },
  },
  build: {
    // outDir should point to 'client' at the project root.
    // path.resolve(__dirname, "../client") resolves to project_root/src/client/../client -> project_root/client
    outDir: path.resolve(__dirname, "../client"),
    emptyOutDir: true,
  },
});
