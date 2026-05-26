import CustomSkeleton from "@/components/CustomSkeleton";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { numToMoney } from "@/utils";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import PlayUSD from "@/assets/play-usd.svg";
import PriceChangeBox from "@/components/PriceChangeBox";
import HoldingsBreakdownBar from "./HoldingsBreakdownBar";
import { fetchWithRefresh } from "@/lib/api";
import ErrorFallback from "@/components/ErrorFallback";

// ===== NAVBAR PREFETCH =====
export function prefetchPortfolioOverview(queryClient: QueryClient) {
  return Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["totalPortfolioValue"],
      queryFn: fetchTotalPortfolioValue,
    }),
    queryClient.prefetchQuery({
      queryKey: ["walletAssets"],
      queryFn: fetchWalletAssets,
    }),
  ]);
}

// ===== TYPES =====
type WalletAsset = {
  id: string;
  name: string;
  ticker: string;
  image: string;
  amount: number;
  totalValue: number;
  priceChange24h: number;
};

// ===== HELPER FUNCTIONS =====
function formatCoinAmount(n: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(n);
}

// ===== API FUNCTIONS =====
async function fetchTotalPortfolioValue() {
  const response = await fetchWithRefresh(
    "http://localhost:5000/get_wallet_total_current_value",
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) throw await response.json();

  return await response.json();
}

async function fetchWalletAssets(): Promise<WalletAsset[]> {
  const response = await fetchWithRefresh(
    "http://localhost:5000/get_wallet_assets",
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) throw await response.json();

  return await response.json();
}

export default function PortfolioOverview() {
  // ===== REACT QUERY HOOKS =====
  const totalPortfolioValueQuery = useQuery({
    queryKey: ["totalPortfolioValue"],
    queryFn: fetchTotalPortfolioValue,
  });

  const walletAssetsQuery = useQuery({
    queryKey: ["walletAssets"],
    queryFn: fetchWalletAssets,
  });

  // ===== STATE VARIABLES =====
  const [isAtBottom, setIsAtBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ===== EVENT HANDLERS =====
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 10);
  }, []);

  // ===== DERIVED STATE =====
  const isError =
    totalPortfolioValueQuery.isError ||
    walletAssetsQuery.isError;

  if (isError) {
    return (
      <Card className="p-0 gap-2 min-h-120 flex items-center justify-center">
        <ErrorFallback
          title="Portfolio unavailable"
          description="Portfolio data could not be loaded."
        />
      </Card>
    );
  }

  return (
    <Card className="p-0 gap-2">
      {/* ===== HEADER ===== */}
      <div className="p-5 pb-2 gap-[-2px]">
        {/* ===== PORTFOLIO VALUE ===== */}
        <p className="text-xs text-gray-500 font-mono">PORTFOLIO VALUE</p>
        {totalPortfolioValueQuery.isLoading && (
          <CustomSkeleton className="h-10 w-full mt-2 mb-4" />
        )}
        {totalPortfolioValueQuery.data && (
          <h1 className="text-2xl font-bold mb-2">
            ${numToMoney(totalPortfolioValueQuery.data)}
          </h1>
        )}
        {/* ===== BREAKDOWN BAR ===== */}
        {!walletAssetsQuery.isLoading && (
          <HoldingsBreakdownBar
            holdings={
              walletAssetsQuery.data?.map((coin) => {
                return {
                  id: coin.id,
                  totalValue: coin.totalValue,
                  ticker: coin.ticker,
                };
              }) ?? []
            }
          />
        )}
      </div>
      <Separator />

      {/* ===== HOLDINGS LIST ===== */}
      <div className="px-5 pt-2 pb-0 gap-[-2px]">
        <div className="flex justify-between text-xs text-gray-500 pb-1">
          <p>HOLDINGS</p>
          <p>VALUE</p>
        </div>

        <div className="relative">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="max-h-140 overflow-y-auto no-scrollbar"
          >
            {walletAssetsQuery.isLoading &&
              Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-2.5 border-b border-[#f0f0f0]"
                >
                  <div className="flex gap-3 items-center">
                    <CustomSkeleton className="size-8 rounded-full" />
                    <CustomSkeleton className="h-4 w-24" />
                  </div>
                  <CustomSkeleton className="h-4 w-20" />
                </div>
              ))}
            {walletAssetsQuery.data &&
              walletAssetsQuery.data.map((c) => (
                <div
                  key={c.id}
                  className="flex justify-between py-2.5 border-b border-[#f0f0f0]"
                >
                  <div className="flex gap-3 items-center">
                    <img
                      src={c.id === "playusd" ? PlayUSD : c.image}
                      className="rounded-4xl size-8"
                    />
                    <div className="flex flex-col">
                      <p className="text-sm font-semibold">{c.name}</p>
                      <p className="text-xs text-gray-500 font-mono">
                        {c.id === "playusd" ? "" : c.ticker}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center items-end">
                    <p className="text-sm font-bold font-mono">
                      ${numToMoney(c.totalValue)}
                    </p>
                    {c.amount && (
                      <div className="flex gap-2 items-center">
                        <PriceChangeBox
                          priceChange={c.priceChange24h}
                          fontSize="xs"
                        />
                        <p className="text-xs text-gray-500 font-mono uppercase">
                          {formatCoinAmount(c.amount)} {c.ticker}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
          <div
            className={`pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-linear-to-b from-transparent to-white transition-opacity duration-200 ${isAtBottom ? "opacity-0" : "opacity-100"}`}
          />
        </div>
      </div>
    </Card>
  );
}
