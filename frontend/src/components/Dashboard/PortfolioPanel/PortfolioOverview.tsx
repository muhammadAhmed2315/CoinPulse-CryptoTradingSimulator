import CustomSkeleton from "@/components/CustomSkeleton";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { numToMoney } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import PlayUSD from "@/assets/play-usd.svg";
import PriceChangeBox from "@/components/PriceChangeBox";

// ===== HELPER FUNCTIONS =====
function formatCoinAmount(n: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(n);
}

// ===== API REQUESTS =====
async function fetchTotalPortfolioValue() {
  const response = await fetch(
    "http://localhost:5000/get_wallet_total_current_value",
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) throw await response.json();

  return await response.json();
}

async function fetchWalletAssets() {
  const response = await fetch("http://localhost:5000/get_wallet_assets", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) throw await response.json();

  return await response.json();
}

export default function PortfolioOverview() {
  // ===== REACT QUERY HOOKS =====
  const totalPortfolioValueQuery = useQuery({
    queryKey: ["total-portfolio-value"],
    queryFn: fetchTotalPortfolioValue,
  });

  const walletAssetsQuery = useQuery({
    queryKey: ["wallet-assets"],
    queryFn: fetchWalletAssets,
  });

  return (
    <Card className="p-0 gap-2">
      {/* HEADER */}
      <div className="p-5 pb-0 gap-[-2px]">
        <p className="text-xs text-gray-500 font-mono">PORTFOLIO VALUE</p>
        {totalPortfolioValueQuery.isLoading && (
          <CustomSkeleton className="h-8 w-90" />
        )}
        {totalPortfolioValueQuery.data && (
          <h1 className="text-2xl font-bold">
            ${numToMoney(totalPortfolioValueQuery.data)}
          </h1>
        )}
        <h1>Bar goes here</h1>
      </div>
      <Separator />

      <div className="p-5 pb-0 gap-[-2px]">
        <div className="flex justify-between text-xs text-gray-500 pb-3.5">
          <p>HOLDINGS</p>
          <p>VALUE</p>
        </div>

        <div className="relative">
          <div className="max-h-140 overflow-y-auto no-scrollbar ">
            {walletAssetsQuery.data &&
              walletAssetsQuery.data.map((c) => (
                <div className="flex justify-between py-3.5 border-b border-[#f0f0f0]">
                  <div className="flex gap-3 items-center">
                    <img
                      src={c.id === "playusd" ? PlayUSD : c.image}
                      className="rounded-4xl size-8"
                    />
                    <div className="flex flex-col">
                      <p className="text-sm font-semibold">{c.name}</p>
                      <p className="text-xs text-gray-500 font-mono">
                        {c.ticker}
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
                        <p className="text-xs text-gray-500 font-mono">
                          {formatCoinAmount(c.amount)} {c.ticker.toUpperCase()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-linear-to-b from-transparent to-white" />
        </div>
      </div>
    </Card>
  );
}
