import TrendingCoins from "@/components/TrendingCoins";
import FeedPost from "@/components/FeedPost";

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-4">
      <TrendingCoins />
      <div className="flex gap-4">
        <p className="text-lg cursor-pointer">Global feed</p>
        <p className="text-lg cursor-pointer">My feed</p>
      </div>
      <FeedPost />
    </div>
  );
}
