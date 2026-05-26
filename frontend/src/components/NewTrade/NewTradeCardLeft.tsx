import formatCompactValue, { numToMoney } from "@/utils";
import PriceChangeBox from "../PriceChangeBox";
import SparklineGraph from "../SparklineGraph";
import { Separator } from "../ui/separator";
import CustomSkeleton from "../CustomSkeleton";
import CustomTooltip from "../CustomTooltip";
import type { UseQueryResult } from "@tanstack/react-query";
import PlayUSD from "@/assets/play-usd.svg";
import type { Coin } from "@/loadAllCoinsList";
import ErrorFallback from "../ErrorFallback";

// ===== TYPES =====
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
  const hasError =
    coinDataQuery.isError ||
    sparklineQuery.isError ||
    userBalanceQuery.isError ||
    coinBalanceQuery.isError;

  if (hasError) {
    return (
      <ErrorFallback
        title="Data unavailable"
        description="Trade information could not be loaded."
        className="min-h-120 gap-3 px-4"
      />
    );
  }

  return (
    <div>
      {/* ===== CURRENT COIN ===== */}
      <div className="flex flex-row gap-2 bg-white px-2 py-1 border border-gray-200 rounded-sm mb-2">
        <img src={currCoin.imgUrl} className="rounded-3xl size-12" />
        <div>
          <p className="font-bold text-xl">{currCoin.name}</p>
          <p className="font-semibold uppercase">{currCoin.ticker}</p>
        </div>
      </div>

      {/* ===== PRICE ===== */}
      <p className="text-xs font-mono text-gray-400 mb-1">PRICE</p>
      <div className="flex items-center justify-between mb-4">
        {coinDataQuery.isLoading ? (
          <CustomSkeleton className="h-9 w-44 rounded-md" />
        ) : (
          <p className="text-3xl font-bold ">
            ${numToMoney(coinDataQuery.data.current_price)}
          </p>
        )}
        <div className="w-fit ">
          {coinDataQuery.isLoading ? (
            <CustomSkeleton className="h-6 w-24 rounded-md" />
          ) : (
            <PriceChangeBox
              priceChange={coinDataQuery.data.price_change_percentage_24h}
              fontSize="sm"
            />
          )}
        </div>
      </div>

      {/* ===== SPARKLINE GRAPH ===== */}
      <div className="flex items-center justify-center h-16 w-80 mb-4">
        {sparklineQuery.isLoading ? (
          <CustomSkeleton className="h-16 w-80 rounded-md" />
        ) : (
          <SparklineGraph data={sparklineQuery.data} width={320} />
        )}
      </div>

      {/* ===== STATS GRID ===== */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-sm bg-white border border-gray-200 p-2">
          <p className="text-xs font-semibold">24H HIGH</p>
          {coinDataQuery.isLoading ? (
            <CustomSkeleton className="h-5 w-20 mt-1 rounded-md" />
          ) : (
            <p className="font-bold">
              ${numToMoney(coinDataQuery.data.high_24h)}
            </p>
          )}
        </div>
        <div className="rounded-sm bg-white border border-gray-200 p-2">
          <p className="text-xs font-semibold">24H LOW</p>
          {coinDataQuery.isLoading ? (
            <CustomSkeleton className="h-5 w-20 mt-1 rounded-md" />
          ) : (
            <p className="font-bold">
              ${numToMoney(coinDataQuery.data.low_24h)}
            </p>
          )}
        </div>
        <div className="rounded-sm bg-white border border-gray-200 p-2">
          <p className="text-xs font-semibold">MARKET CAP</p>
          {coinDataQuery.isLoading ? (
            <CustomSkeleton className="h-5 w-16 mt-1 rounded-md" />
          ) : (
            <p className="font-bold">
              {formatCompactValue(coinDataQuery.data.market_cap)}
            </p>
          )}
        </div>
        <div className="rounded-sm bg-white border border-gray-200 p-2">
          <p className="text-xs font-semibold">VOLUME</p>
          {coinDataQuery.isLoading ? (
            <CustomSkeleton className="h-5 w-16 mt-1 rounded-md" />
          ) : (
            <p className="font-bold">
              {formatCompactValue(coinDataQuery.data.total_volume)}
            </p>
          )}
        </div>
      </div>

      <Separator className="my-4" />

      {/* ===== USD BALANCE ===== */}
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

      {/* ===== COIN BALANCE ===== */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-400 font-mono uppercase">
            {currCoin.ticker} BALANCE
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
