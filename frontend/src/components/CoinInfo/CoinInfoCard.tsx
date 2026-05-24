import { QueryClient, useQuery } from "@tanstack/react-query";
import CoinSearchBar from "../CoinSearchBar";
import { Card } from "../ui/card";
import { loadAllCoinsList, type Coin } from "@/loadAllCoinsList";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import CustomSkeleton from "../CustomSkeleton";
import SparklineGraph from "../SparklineGraph";
import formatCompactValue, { numToMoney } from "@/utils";

// ===== NAVBAR PREFETCH =====
export function prefetchCoinInfoCard(
  queryClient: QueryClient,
  coinId: string = "bitcoin",
) {
  return Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["detailedCoinData", coinId],
      queryFn: () => getDetailedCoinData(coinId),
    }),
    queryClient.prefetchQuery({
      queryKey: ["coinSparkline", coinId],
      queryFn: () => getCoinSparkline(coinId),
    }),
  ]);
}

// ===== TYPES =====
type CoinInfoCardProps = {
  currCoin: Coin;
  setCurrCoin: React.Dispatch<React.SetStateAction<Coin>>;
};

// ===== API FUNCTIONS =====
async function getDetailedCoinData(coin_id: string) {
  const response = await fetch(
    `http://localhost:5000/get_coin_data/${coin_id}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) throw await response.json();

  return await response.json();
}

async function getCoinSparkline(coin_id: string) {
  const response = await fetch(
    `http://localhost:5000/get_coin_sparkline/${coin_id}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) throw await response.json();

  return await response.json();
}

export default function CoinInfoCard({
  currCoin,
  setCurrCoin,
}: CoinInfoCardProps) {
  // ===== STATE VARIABLES =====
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query.toLowerCase(), 300);

  // ===== REACT QUERY HOOKS =====
  const allCoinsQuery = useQuery({
    queryKey: ["allCoinsList"],
    queryFn: loadAllCoinsList,
  });

  const detailedCoinDataQuery = useQuery({
    queryKey: ["detailedCoinData", currCoin.id],
    queryFn: () => getDetailedCoinData(currCoin.id),
  });

  const coinSparklineQuery = useQuery({
    queryKey: ["coinSparkline", currCoin.id],
    queryFn: () => getCoinSparkline(currCoin.id),
  });

  // ===== DERIVED STATE =====
  const coinData = detailedCoinDataQuery.data;
  const coinSparkline = coinSparklineQuery.data;
  const allTimePercentage = coinData
    ? ((coinData.current_price - coinData.atl) /
        (coinData.ath - coinData.atl)) *
      100
    : 0;

  return (
    <Card className="flex-3 p-0 gap-0 overflow-hidden rounded-[18px] border-[#f0f0f0] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {/* ===== HEADER ===== */}
      <div className="flex items-end justify-between gap-4 px-6 pt-5.5 pb-4.5 border-b border-[#f0f0f0]">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500 leading-none">
            Coin Lookup
          </span>
          <h2 className="text-[22px] font-bold tracking-[-0.015em] leading-none">
            Search for a coin
          </h2>
        </div>

        <div className="w-[50%]">
          {allCoinsQuery.isLoading ? (
            <>Loading...</>
          ) : (
            <CoinSearchBar
              coins={allCoinsQuery.data!}
              query={query}
              setQuery={setQuery}
              debouncedQuery={debouncedQuery}
              setCurrCoin={setCurrCoin}
            />
          )}
        </div>
      </div>

      {/* ===== COIN TITLE ===== */}
      <div className="px-6 py-5">
        {coinData ? (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <img
                src={coinData.image}
                className="size-11 rounded-full shrink-0"
              />

              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <p className="text-xl font-bold tracking-[-0.01em] leading-none">
                    {coinData.name}
                  </p>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-500 bg-zinc-50 border border-[#ececef] px-1.5 py-[3px] rounded-md">
                    #{coinData.market_cap_rank}
                  </span>
                </div>
                <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-zinc-500 font-medium">
                  {coinData.symbol}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 text-right shrink-0">
              <p className="font-mono text-2xl font-semibold tracking-[-0.02em] leading-none">
                ${numToMoney(coinData.current_price.toFixed(2))}
              </p>
              <div className="flex items-center gap-2.5">
                <p
                  className={`font-mono text-xs font-semibold ${
                    coinData.price_change_percentage_24h > 0
                      ? "text-[#21c45d]"
                      : "text-[#ef4444]"
                  }`}
                >
                  {coinData.price_change_percentage_24h > 0 ? "↑" : "↓"}{" "}
                  {Math.abs(coinData.price_change_percentage_24h).toFixed(2)}%
                </p>
                <span className="font-mono text-[11px] font-medium tracking-[0.04em] text-zinc-500">
                  24H
                </span>
              </div>
            </div>
          </div>
        ) : (
          <CustomSkeleton />
        )}
      </div>

      {/* ===== SPARKLINE GRAPH ===== */}
      <div className="px-6 pt-2 pb-5 border-b border-[#f0f0f0]">
        {coinSparkline ? (
          <>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Last 7d
              </span>
              <span
                className={`font-mono text-[11px] font-semibold ${
                  coinSparkline.at(-1) > coinSparkline.at(0)
                    ? "text-[#21c45d]"
                    : "text-[#ef4444]"
                }`}
              >
                {coinSparkline.at(-1) > coinSparkline.at(0) ? "↑" : "↓"}{" "}
                {Math.abs(
                  ((coinSparkline.at(-1) - coinSparkline.at(0)) /
                    coinSparkline.at(0)) *
                    100,
                ).toFixed(2)}
                %
              </span>
            </div>
            <SparklineGraph data={coinSparkline} width={600} />
          </>
        ) : (
          <CustomSkeleton />
        )}
      </div>

      {/* ===== DETAILED COIN DATA ===== */}
      <div>
        {coinData ? (
          <>
            <div className="px-6 pt-3.5 pb-2.5 bg-zinc-50 border-y border-[#f0f0f0]">
              <span className="text-[13px] font-bold tracking-[-0.005em]">
                Market Data
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-[#f0f0f0]">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Market Cap
              </span>
              <span className="font-mono text-[13px] font-semibold">
                ${formatCompactValue(coinData.market_cap)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-[#f0f0f0]">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Volume (24h)
              </span>
              <span className="font-mono text-[13px] font-semibold">
                ${formatCompactValue(coinData.total_volume)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-[#f0f0f0]">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Circulating Supply
              </span>
              <span className="font-mono text-[13px] font-semibold">
                {numToMoney(coinData.circulating_supply, false, 0)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-[#f0f0f0]">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Total Supply
              </span>
              <span className="font-mono text-[13px] font-semibold">
                {numToMoney(coinData.total_supply, false, 0)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-[#f0f0f0]">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Max Supply
              </span>
              <span className="font-mono text-[13px] font-semibold">
                {numToMoney(coinData.max_supply, false, 0)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 px-6 py-3">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Fully Diluted Cap
              </span>
              <span className="font-mono text-[13px] font-semibold">
                ${formatCompactValue(coinData.fully_diluted_valuation)}
              </span>
            </div>
          </>
        ) : (
          <CustomSkeleton />
        )}
      </div>

      {/* ===== ATL/ATH BAR ===== */}
      {coinData ? (
        <div className="px-6 pt-[18px] pb-8 border-t border-[#f0f0f0]">
          <div className="flex w-full justify-between gap-3 mb-3.5">
            <div className="flex flex-col gap-[3px]">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                All-Time Low
              </span>
              <span className="font-mono text-sm font-semibold leading-tight">
                ${numToMoney(coinData.atl)}
              </span>
              <span
                className={`font-mono text-[11px] font-semibold ${
                  coinData.atl_change_percentage > 0
                    ? "text-[#21c45d]"
                    : "text-[#ef4444]"
                }`}
              >
                {coinData.atl_change_percentage > 0 ? "↑" : "↓"}
                {numToMoney(Math.abs(coinData.atl_change_percentage))}%
              </span>
            </div>

            <div className="flex flex-col gap-[3px] items-end text-right">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                All-Time High
              </span>
              <span className="font-mono text-sm font-semibold leading-tight">
                ${numToMoney(coinData.ath)}
              </span>
              <span
                className={`font-mono text-[11px] font-semibold ${
                  coinData.ath_change_percentage > 0
                    ? "text-[#21c45d]"
                    : "text-[#ef4444]"
                }`}
              >
                {coinData.ath_change_percentage > 0 ? "↑" : "↓"}
                {numToMoney(Math.abs(coinData.ath_change_percentage))}%
              </span>
            </div>
          </div>

          <div className="flex relative items-center w-full h-1.5 rounded-full bg-linear-to-r from-red-50 via-zinc-50 to-emerald-50 mt-[18px] mb-2">
            <div className="absolute inset-0 rounded-full bg-linear-to-r from-red-500 via-zinc-400 to-emerald-500 opacity-35"></div>

            <div
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: `${allTimePercentage}%` }}
            >
              <div className="h-3.5 w-3.5 rounded-full bg-[#111111] border-[3px] border-white shadow-[0_0_0_1px_#ececef,0_1px_2px_rgba(0,0,0,0.12)]"></div>
              <span className="absolute top-[calc(100%+8px)] font-mono text-[10px] font-semibold tracking-[0.04em] text-white bg-[#111111] px-1.5 py-[3px] rounded-[5px] whitespace-nowrap before:content-[''] before:absolute before:bottom-full before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-b-[#111111]">
                ${numToMoney(coinData.current_price.toFixed(2))}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <CustomSkeleton />
      )}
    </Card>
  );
}
