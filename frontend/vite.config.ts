import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
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
          // Keep React in its own vendor chunk so it isn't absorbed into the
          // ag-grid/highcharts chunks (which would force the entry to eagerly
          // depend on — and modulepreload — those heavy chunks on every page).
          react: ["react", "react-dom", "react-router-dom"],
          highcharts: ["highcharts", "@highcharts/react"],
          "ag-grid": ["ag-grid-community", "ag-grid-react"],
        },
      },
    },
  },
});
