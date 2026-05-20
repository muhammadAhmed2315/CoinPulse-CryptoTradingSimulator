import CoinInfoCard from "@/components/CoinInfo/CoinInfoCard";
import MarketChartsCard from "@/components/CoinInfo/MarketChartsCard";
import NewsFeed from "@/components/CoinInfo/NewsFeed";
import RedditFeedCard from "@/components/CoinInfo/RedditFeed";

import BitcoinLogo from "../assets/logos/bitcoin.png";
import { useState } from "react";
import type { Coin } from "@/loadAllCoinsList";
import { useLocation } from "react-router-dom";

export default function CoinInfo() {
  // ===== STATE VARIABLES =====
  const location = useLocation();

  const [currCoin, setCurrCoin] = useState<Coin>(
    location.state
      ? location.state.coin
      : {
          id: "bitcoin",
          name: "Bitcoin",
          ticker: "btc",
          imgUrl: BitcoinLogo,
        },
  );

  return (
    <div className="w-full flex flex-col gap-4 px-4">
      {/* ===== TOP ROW ===== */}
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
      {/* ===== BOTTOM ROW ===== */}
      <div className="flex w-full gap-4">
        <NewsFeed coinName={currCoin.name} />
        <RedditFeedCard coinName={currCoin.name} />
      </div>
    </div>
  );
}
