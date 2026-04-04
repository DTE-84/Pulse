import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));
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
        },
    },
});
