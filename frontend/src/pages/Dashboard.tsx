import TrendingCoins from "@/components/TrendingCoins";
import FeedPost from "@/components/FeedPost";
import PortfolioOverview from "@/components/PortfolioOverview";
import { useEffect } from "react";
import axios from "axios";

export default function Dashboard() {
  useEffect(() => {
    async function callback() {
      const res = await axios.get("http://127.0.0.1:5000/auth/me", {
        withCredentials: true,
      });
      const data = res.data;
      console.log(data);
    }

    callback();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <TrendingCoins />

      <div className="flex gap-12.5">
        <div className="flex flex-col flex-2">
          <div className="flex gap-4">
            <p className="text-lg cursor-pointer">Global feed</p>
            <p className="text-lg cursor-pointer">My feed</p>
          </div>
          <div>
            <FeedPost />
            <br />
            <FeedPost />
            <br />
            <FeedPost />
            <br />
            <FeedPost />
          </div>
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
