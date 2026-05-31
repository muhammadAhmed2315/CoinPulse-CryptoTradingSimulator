import { QueryClient, useQuery } from "@tanstack/react-query";
import CoinSearchBar from "../CoinSearchBar";
import { Card } from "../ui/card";
import { loadAllCoinsList, type Coin } from "@/loadAllCoinsList";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import CustomSkeleton from "../CustomSkeleton";
import ErrorFallback from "../ErrorFallback";
import SparklineGraph from "../SparklineGraph";
import formatCompactValue, { numToMoney } from "@/utils";
import { fetchWithRefresh } from "@/lib/api";
import { prefetchCoinInfo } from "@/pages/CoinInfo";

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
  const response = await fetchWithRefresh(
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
  const response = await fetchWithRefresh(
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
    staleTime: Infinity,
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
  const hasBodyError =
    detailedCoinDataQuery.isError || coinSparklineQuery.isError;

  return (
    <Card className="flex-3 p-0 gap-0 overflow-hidden rounded-[18px] border-border shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {/* ===== HEADER ===== */}
      <div className="flex items-end justify-between gap-4 px-6 pt-5.5 pb-4.5 border-b border-border">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground leading-none">
            Coin Lookup
          </span>
          <h2 className="text-[22px] font-bold tracking-[-0.015em] leading-none">
            Search for a coin
          </h2>
        </div>

        <div className="w-[50%]">
          {allCoinsQuery.isLoading ? (
            <CustomSkeleton className="h-9 w-full rounded-md" />
          ) : allCoinsQuery.isError ? (
            <ErrorFallback
              horizontal
              description="Coin search unavailable"
              size="sm"
              className="h-9 px-3 gap-2 rounded-md border border-border bg-muted justify-start"
            />
          ) : (
            <CoinSearchBar
              coins={allCoinsQuery.data!}
              query={query}
              setQuery={setQuery}
              debouncedQuery={debouncedQuery}
              setCurrCoin={setCurrCoin}
              prefetchFn={prefetchCoinInfo}
            />
          )}
        </div>
      </div>

      {hasBodyError ? (
        <ErrorFallback
          title="Data unavailable"
          description="Coin data could not be loaded."
          className="flex-1"
        />
      ) : (
        <>
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
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground bg-muted border border-border px-1.5 py-[3px] rounded-md">
                        #{coinData.market_cap_rank}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground font-medium">
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
                      {Math.abs(coinData.price_change_percentage_24h).toFixed(
                        2,
                      )}
                      %
                    </p>
                    <span className="font-mono text-[11px] font-medium tracking-[0.04em] text-muted-foreground">
                      24H
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <CustomSkeleton className="size-11 rounded-full shrink-0" />
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <CustomSkeleton className="h-5 w-32" />
                    <CustomSkeleton className="h-3 w-12" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 text-right shrink-0">
                  <CustomSkeleton className="h-6 w-28" />
                  <CustomSkeleton className="h-3.5 w-16" />
                </div>
              </div>
            )}
          </div>

          {/* ===== SPARKLINE GRAPH ===== */}
          <div className="px-6 pt-2 pb-5 border-b border-border">
            {coinSparkline ? (
              <>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
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
              <>
                <div className="flex items-center justify-between mb-1.5">
                  <CustomSkeleton className="h-3 w-12" />
                  <CustomSkeleton className="h-3 w-14" />
                </div>
                <CustomSkeleton className="h-20 w-full rounded-md" />
              </>
            )}
          </div>

          {/* ===== DETAILED COIN DATA ===== */}
          <div>
            {coinData ? (
              <>
                <div className="px-6 pt-3.5 pb-2.5 bg-muted border-y border-border">
                  <span className="text-[13px] font-bold tracking-[-0.005em]">
                    Market Data
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-border">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Market Cap
                  </span>
                  <span className="font-mono text-[13px] font-semibold">
                    ${formatCompactValue(coinData.market_cap)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-border">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Volume (24h)
                  </span>
                  <span className="font-mono text-[13px] font-semibold">
                    ${formatCompactValue(coinData.total_volume)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-border">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Circulating Supply
                  </span>
                  <span className="font-mono text-[13px] font-semibold">
                    {numToMoney(coinData.circulating_supply, false, 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-border">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Total Supply
                  </span>
                  <span className="font-mono text-[13px] font-semibold">
                    {numToMoney(coinData.total_supply, false, 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-border">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Max Supply
                  </span>
                  <span className="font-mono text-[13px] font-semibold">
                    {numToMoney(coinData.max_supply, false, 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 px-6 py-3">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Fully Diluted Cap
                  </span>
                  <span className="font-mono text-[13px] font-semibold">
                    ${formatCompactValue(coinData.fully_diluted_valuation)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="px-6 pt-3.5 pb-2.5 bg-muted border-y border-border">
                  <CustomSkeleton className="h-4 w-24" />
                </div>
                {Array.from({ length: 6 }, (_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 px-6 py-3 border-b border-border last:border-b-0"
                  >
                    <CustomSkeleton className="h-3 w-24" />
                    <CustomSkeleton className="h-3.5 w-20" />
                  </div>
                ))}
              </>
            )}
          </div>

          {/* ===== ATL/ATH BAR ===== */}
          {coinData ? (
            <div className="px-6 pt-[18px] pb-8 border-t border-border">
              <div className="flex w-full justify-between gap-3 mb-3.5">
                <div className="flex flex-col gap-[3px]">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
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
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
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

              <div className="flex relative items-center w-full h-1.5 rounded-full bg-linear-to-r from-red-50 via-zinc-50 to-emerald-50 dark:from-red-500/25 dark:via-zinc-500/20 dark:to-emerald-500/25 mt-[18px] mb-2">
                <div className="absolute inset-0 rounded-full bg-linear-to-r from-red-500 via-zinc-400 to-emerald-500 opacity-35 dark:from-red-500 dark:via-zinc-400 dark:to-emerald-400 dark:opacity-70"></div>

                <div
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                  style={{ left: `${allTimePercentage}%` }}
                >
                  <div className="h-3.5 w-3.5 rounded-full bg-foreground border-[3px] border-card shadow-[0_0_0_1px_#ececef,0_1px_2px_rgba(0,0,0,0.12)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_1px_2px_rgba(0,0,0,0.5)]"></div>
                  <span className="absolute top-[calc(100%+8px)] font-mono text-[10px] font-semibold tracking-[0.04em] text-background bg-foreground px-1.5 py-[3px] rounded-[5px] whitespace-nowrap before:content-[''] before:absolute before:bottom-full before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-b-foreground">
                    ${numToMoney(coinData.current_price.toFixed(2))}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-6 pt-4.5 pb-8 border-t border-border">
              <div className="flex w-full justify-between gap-3 mb-3.5">
                <div className="flex flex-col gap-1.25">
                  <CustomSkeleton className="h-3 w-20" />
                  <CustomSkeleton className="h-4 w-16" />
                  <CustomSkeleton className="h-3 w-12" />
                </div>
                <div className="flex flex-col gap-1.25 items-end">
                  <CustomSkeleton className="h-3 w-20" />
                  <CustomSkeleton className="h-4 w-16" />
                  <CustomSkeleton className="h-3 w-12" />
                </div>
              </div>

              <CustomSkeleton className="h-1.5 w-full rounded-full mt-8.5 mb-2" />
            </div>
          )}
        </>
      )}
    </Card>
  );
}
