import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    exclude: ["@highcharts/react"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          highcharts: ["highcharts", "@highcharts/react"],
          "ag-grid": ["ag-grid-community", "ag-grid-react"],
        },
      },
    },
  },
});
