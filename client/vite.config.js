import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "@components": path.resolve(import.meta.dirname, "./src/components"),
      "@pages": path.resolve(import.meta.dirname, "./src/pages"),
      "@hooks": path.resolve(import.meta.dirname, "./src/hooks"),
      "@services": path.resolve(import.meta.dirname, "./src/services"),
      "@redux": path.resolve(import.meta.dirname, "./src/redux"),
      "@utils": path.resolve(import.meta.dirname, "./src/utils"),
      "@assets": path.resolve(import.meta.dirname, "./src/assets"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("recharts")) return "charts";
            if (id.includes("framer-motion") || id.includes("lucide-react")) return "ui";
            return "vendor";
          }
        },
      },
    },
  },
});
