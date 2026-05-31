import { createRoot } from "react-dom/client";
import "./index.css";
import "./lib/api";
import App from "./App.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

// ===== SETUP =====
ModuleRegistry.registerModules([AllCommunityModule]);

const queryClient = new QueryClient();

// ===== RENDER =====
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
);
