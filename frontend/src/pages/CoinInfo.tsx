import CoinInfoCard from "@/components/CoinInfo/CoinInfoCard";
import MarketChartsCard from "@/components/CoinInfo/MarketChartsCard";
import NewsFeedCard from "@/components/CoinInfo/NewsFeedCard";
import RedditFeedCard from "@/components/CoinInfo/RedditFeedCard";

export default function CoinInfo() {
  return (
    <div className="w-full flex flex-col gap-4 px-4">
      <div className="flex w-full gap-4">
        <CoinInfoCard />
        <MarketChartsCard />
      </div>
      <div className="flex w-full gap-4">
        <NewsFeedCard />
        <RedditFeedCard />
      </div>
    </div>
  );
}
