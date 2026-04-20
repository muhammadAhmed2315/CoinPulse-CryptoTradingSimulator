import FeedPostMenu from "@/components/Dashboard/Feed/FeedPostMenu";
import PortfolioPanel from "@/components/Dashboard/PortfolioPanel/PortfolioPanel";
import TrendingCoins from "@/components/Dashboard/TrendingCoins/TrendingCoins";
import { useQuery } from "@tanstack/react-query";

async function getTrendingCoins() {
  const response = await fetch("http://localhost:5000/get_trending_coins", {
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
  const trendingCoinsQuery = useQuery({
    queryKey: ["trendingCoins"],
    queryFn: getTrendingCoins,
  });

  return (
    <div className="flex flex-col gap-4">
      <TrendingCoins
        isError={trendingCoinsQuery.isError}
        isLoading={trendingCoinsQuery.isLoading}
        data={trendingCoinsQuery.data || undefined}
      />

      <div className="flex gap-12.5 mt-6">
        <div className="flex flex-col flex-2">
          <FeedPostMenu />
        </div>

        <div className="flex-1">
          <PortfolioPanel />
        </div>
      </div>
    </div>
  );
}
