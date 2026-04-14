import FeedPost from "@/components/Dashboard/Feed/FeedPost";
import FeedPostMenu from "@/components/Dashboard/Feed/FeedPostMenu";
import PortfolioOverview from "@/components/Dashboard/PortfolioPanel/PortfolioOverview";
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

      <div className="flex gap-12.5">
        <div className="flex flex-col flex-2">
          <FeedPostMenu />
        </div>

        <div className="flex-1">
          <div className="flex gap-4">
            <p className="text-lg cursor-pointer">Portfolio Overview</p>
            <p className="text-lg cursor-pointer">Open Positions</p>
          </div>
          <PortfolioOverview />
        </div>
      </div>
    </div>
  );
}
