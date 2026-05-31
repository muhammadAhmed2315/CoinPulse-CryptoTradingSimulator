import TradesTable, { prefetchTradesTable } from "@/components/TradesTable";
import PortfolioAnalytics, {
  prefetchPortfolioAnalytics,
} from "../components/PortfolioAnalytics";
import type { QueryClient } from "@tanstack/react-query";

// ===== API FUNCTIONS =====
export function prefetchMyTrades(queryClient: QueryClient) {
  return Promise.all([
    prefetchPortfolioAnalytics(queryClient),
    prefetchTradesTable(queryClient),
  ]);
}

export default function MyTrades() {
  return (
    <div>
      {/* ===== PORTFOLIO ANALYTICS ===== */}
      <PortfolioAnalytics />
      <br />
      {/* ===== TRADES TABLE ===== */}
      <TradesTable />
    </div>
  );
}
