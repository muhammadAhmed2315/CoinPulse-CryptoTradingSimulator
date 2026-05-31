import FeedPostMenu, {
  prefetchFeedPosts,
} from "@/components/Dashboard/Feed/FeedPostMenu";
import { prefetchOpenPositions } from "@/components/Dashboard/PortfolioPanel/OpenPositions";
import { prefetchPortfolioOverview } from "@/components/Dashboard/PortfolioPanel/PortfolioOverview";
import PortfolioPanel from "@/components/Dashboard/PortfolioPanel/PortfolioPanel";
import TrendingCoins from "@/components/Dashboard/TrendingCoins/TrendingCoins";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { fetchWithRefresh } from "@/lib/api";

// ===== NAVBAR PREFETCH =====
export function prefetchDashboard(queryClient: QueryClient) {
  return Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["trendingCoins"],
      queryFn: getTrendingCoins,
    }),
    prefetchFeedPosts(queryClient),
    prefetchPortfolioOverview(queryClient),
    prefetchOpenPositions(queryClient),
  ]);
}

// ===== API FUNCTIONS =====
async function getTrendingCoins() {
  const response = await fetchWithRefresh("http://localhost:5000/get_trending_coins", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const body = await response.json();
    throw { status: response.status, ...body };
  }

  return await response.json();
}

export default function Dashboard() {
  // ===== REACT QUERY HOOKS =====
  const trendingCoinsQuery = useQuery({
    queryKey: ["trendingCoins"],
    queryFn: getTrendingCoins,
    staleTime: 30_000,
  });

  return (
    <div className="flex flex-col gap-4">
      {/* ===== TRENDING COINS ===== */}
      <TrendingCoins
        isError={trendingCoinsQuery.isError}
        isLoading={trendingCoinsQuery.isLoading}
        data={trendingCoinsQuery.data || undefined}
      />

      {/* ===== FEED & PORTFOLIO ===== */}
      <div className="flex gap-12.5 mt-6">
        {/* ===== FEED ===== */}
        <div className="flex flex-col flex-2">
          <FeedPostMenu />
        </div>

        {/* ===== PORTFOLIO ===== */}
        <div className="flex-1 min-w-0">
          <PortfolioPanel />
        </div>
      </div>
    </div>
  );
}
