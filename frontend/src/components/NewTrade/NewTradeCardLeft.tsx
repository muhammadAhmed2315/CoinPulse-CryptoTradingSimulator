import formatCompactValue, { numToMoney } from "@/utils";
import PriceChangeBox from "../PriceChangeBox";
import { Spinner } from "../ui/spinner";
import SparklineGraph from "../SparklineGraph";
import { Separator } from "../ui/separator";
import CustomSkeleton from "../CustomSkeleton";
import CustomTooltip from "../CustomTooltip";
import type { UseQueryResult } from "@tanstack/react-query";
import PlayUSD from "@/assets/play-usd.svg";
import type { Coin } from "@/loadAllCoinsList";

export type NewTradeCardLeftProps = {
  coinDataQuery: UseQueryResult<any, Error>;
  sparklineQuery: UseQueryResult<any, Error>;
  userBalanceQuery: UseQueryResult<any, Error>;
  coinBalanceQuery: UseQueryResult<any, Error>;
  currCoin: Coin;
};

// TODO: Make clicking the "Display currently selected coin" div take you to the coin
//       info page. Could also maybe have a hover tip that shows where clicking the box
//       will take you.

export default function NewTradeCardLeft({
  coinDataQuery,
  sparklineQuery,
  userBalanceQuery,
  coinBalanceQuery,
  currCoin,
}: NewTradeCardLeftProps) {
  return (
    <div>
      {/* Display currently selected coin */}
      <div className="flex flex-row gap-2 bg-white px-2 py-1 border border-gray-200 rounded-sm mb-2">
        <img src={currCoin.imgUrl} className="rounded-3xl size-12" />
        <div>
          <p className="font-bold text-xl">{currCoin.name}</p>
          <p className="font-semibold">{currCoin.ticker.toUpperCase()}</p>
        </div>
      </div>

      {/* Display current coin price + percentage change */}
      <p className="text-xs font-mono text-gray-400">PRICE</p>
      <div className="flex items-center justify-between mb-4">
        <p className="text-3xl font-bold ">
          $
          {coinDataQuery.data
            ? numToMoney(coinDataQuery.data[0].current_price)
            : "Undefined"}
        </p>
        <div className="w-fit ">
          {!coinDataQuery.data ? (
            "Undefined"
          ) : (
            <PriceChangeBox
              priceChange={coinDataQuery.data[0].price_change_percentage_24h}
              fontSize="sm"
            />
          )}
        </div>
      </div>

      {/* Sparkline graph */}
      <div className="flex items-center justify-center h-16 w-80 mb-4">
        {sparklineQuery.isLoading ? (
          <Spinner className="size-7" />
        ) : (
          <SparklineGraph data={sparklineQuery.data} width={320} />
        )}
      </div>

      {/* Information grid (4 boxes) */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-sm bg-white border border-gray-200 p-2">
          <p className="text-xs font-semibold">24H HIGH</p>
          <p className="font-bold">
            $
            {coinDataQuery.data
              ? numToMoney(coinDataQuery.data[0].high_24h)
              : "Undefined"}
          </p>
        </div>
        <div className="rounded-sm bg-white border border-gray-200 p-2">
          <p className="text-xs font-semibold">24H LOW</p>
          <p className="font-bold">
            $
            {coinDataQuery.data
              ? numToMoney(coinDataQuery.data[0].low_24h)
              : "Undefined"}
          </p>
        </div>
        <div className="rounded-sm bg-white border border-gray-200 p-2">
          <p className="text-xs font-semibold">MARKET CAP</p>
          <p className="font-bold">
            {coinDataQuery.data
              ? formatCompactValue(coinDataQuery.data[0].market_cap)
              : "Undefined"}
          </p>
        </div>
        <div className="rounded-sm bg-white border border-gray-200 p-2">
          <p className="text-xs font-semibold">VOLUME</p>
          <p className="font-bold">
            {coinDataQuery.data
              ? formatCompactValue(coinDataQuery.data[0].total_volume)
              : "Undefined"}
          </p>
        </div>
      </div>

      <Separator className="my-4" />

      {/* User's current PlayUSD balance */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <p className="text-xs text-gray-400 font-mono">USD BALANCE</p>
          {userBalanceQuery.isLoading ? (
            <CustomSkeleton className="h-6 w-25" />
          ) : (
            <p className="font-bold">{numToMoney(userBalanceQuery.data)}</p>
          )}
        </div>
        <img src={PlayUSD} className="size-6.5" />
      </div>

      {/* User's current coin balance */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-400 font-mono">
            {currCoin.ticker.toUpperCase()} BALANCE
          </p>
          {coinBalanceQuery.isLoading ? (
            <CustomSkeleton className="w-25 h-6" />
          ) : (
            <CustomTooltip
              trigger={`${coinBalanceQuery.data.toFixed(8)}...`}
              content={coinBalanceQuery.data}
              triggerStyle="font-bold"
            />
          )}
        </div>
        <img src={currCoin.imgUrl} className="size-6.5 rounded-3xl" />
      </div>
    </div>
  );
}
