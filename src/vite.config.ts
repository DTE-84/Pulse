import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react-swc";

// Define project root as an absolute path
const projectRoot = "C:\Users\drewt\dtedev\PulseAi-Prod";

export default defineConfig({
  // Set Vite's root to the project root directory.
  root: projectRoot,

  plugins: [react()],
  base: "/",
  resolve: {
    alias: {
      // Alias should point to src/client relative to the project root.
      "@": path.join(projectRoot, "src/client"),
    },
  },
  build: {
    // outDir should be 'client' at the project root.
    outDir: path.join(projectRoot, "client"),
    emptyOutDir: true,
    rollupOptions: {
      // Explicitly define the entry point to index.html using absolute path.
      input: {
        main: path.join(projectRoot, "src/client/index.html"),
      },
    },
  },
});
