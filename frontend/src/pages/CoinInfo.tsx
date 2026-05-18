import CoinInfoCard from "@/components/CoinInfo/CoinInfoCard";
import MarketChartsCard from "@/components/CoinInfo/MarketChartsCard";
import NewsFeedCard from "@/components/CoinInfo/NewsFeedCard";
import RedditFeedCard from "@/components/CoinInfo/RedditFeedCard";

import BitcoinLogo from "../assets/logos/bitcoin.png";
import { useState } from "react";
import type { Coin } from "@/loadAllCoinsList";

export default function CoinInfo() {
  // ===== STATE VARIABLES =====
  const [currCoin, setCurrCoin] = useState<Coin>({
    id: "bitcoin",
    name: "Bitcoin",
    ticker: "btc",
    imgUrl: BitcoinLogo,
  });

  return (
    <div className="w-full flex flex-col gap-4 px-4">
      <div className="flex w-full gap-4">
        <CoinInfoCard currCoin={currCoin} setCurrCoin={setCurrCoin} />
        <MarketChartsCard
          currCoin={{
            id: currCoin.id,
            name: currCoin.name,
            ticker: currCoin.ticker,
          }}
        />
      </div>
      <div className="flex w-full gap-4">
        <NewsFeedCard />
        <RedditFeedCard coinName={currCoin.name} />
      </div>
    </div>
  );
}
