import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react-swc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    publicDir: false,
    build: {
        lib: {
            entry: path.resolve(__dirname, "src/server/node-build.ts"),
            name: "server",
            fileName: "production",
            formats: ["es"],
        },
        outDir: "server-dist",
        target: "node22",
        ssr: true,
        rollupOptions: {
            external: [
                "fs",
                "path",
                "url",
                "http",
                "https",
                "os",
                "crypto",
                "stream",
                "util",
                "events",
                "buffer",
                "querystring",
                "child_process",
                // External dependencies that should not be bundled
                "express",
                "cors",
                "pg",
                "dotenv",
                "bcryptjs",
                "jsonwebtoken",
                "stripe",
                "plaid",
                "axios",
                "@google/generative-ai",
                "@supabase/supabase-js",
            ],
            output: {
                format: "es",
                entryFileNames: "production.mjs",
            },
        },
        minify: false, // Keep readable for debugging
        sourcemap: true,
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./client"),
            "@shared": path.resolve(__dirname, "./shared"),
        },
    },
    define: {
        "process.env.NODE_ENV": '"production"',
    },
    plugins: [react()],
});
