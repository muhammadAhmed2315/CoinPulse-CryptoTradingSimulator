import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "@/components/animate-ui/components/animate/tabs";
import { Card, CardAction, CardHeader, CardTitle } from "@/components/ui/card";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { numToMoney } from "@/utils";
import PortfolioChartPanel from "./PortfolioChartPanel";
import { fetchWithRefresh } from "@/lib/api";
import CustomSkeleton from "./CustomSkeleton";
import { Separator } from "./ui/separator";
import ErrorFallback from "./ErrorFallback";

// ===== SKELETON =====
function ChartPanelSkeleton() {
  return (
    <>
      <div className="px-6">
        <CustomSkeleton className="h-98 w-full mt-3 mb-3" />
      </div>
      <Separator className="bg-muted" />
      <div className="grid grid-cols-4 w-full">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={`flex flex-col gap-2 px-6 py-4 pb-6 ${
              i > 0 ? "border-l border-border" : ""
            }`}
          >
            <CustomSkeleton className="h-3.5 w-10" />
            <CustomSkeleton className="h-7 w-24" />
          </div>
        ))}
      </div>
    </>
  );
}

// ===== ERROR STATE =====
function ChartPanelError() {
  return (
    <div className="px-6 pb-6">
      <ErrorFallback
        title="Data unavailable"
        description="Portfolio history could not be loaded."
        className="h-125 w-full mt-3 border border-border rounded-md"
      />
    </div>
  );
}

// ===== NAVBAR PREFETCH =====
export function prefetchPortfolioAnalytics(queryClient: QueryClient) {
  return Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["portfolioHistory"],
      queryFn: fetchPortfolioHistory,
      staleTime: 30_000,
    }),
  ]);
}

// ===== API FUNCTIONS =====
async function fetchPortfolioHistory() {
  const response = await fetchWithRefresh(
    "http://localhost:5000/get_wallet_history",
    {
      method: "get",
      credentials: "include",
    },
  );

  if (!response.ok) throw await response.json();

  return await response.json();
}

export default function PortfolioAnalytics() {
  // ===== STATE VARIABLES =====
  const [activeTab, setActiveTab] = useState<
    "totalValue" | "assets" | "balance"
  >("totalValue");
  const [totalValueOpened, setTotalValueOpened] = useState(1);
  const [assetsOpened, setAssetsOpened] = useState(0);
  const [balanceOpened, setBalanceOpened] = useState(0);

  // ===== REACT QUERY HOOKS =====
  const portfolioHistoryQuery = useQuery({
    queryKey: ["portfolioHistory"],
    queryFn: fetchPortfolioHistory,
  });

  // ===== DERIVED STATE =====
  const isError = portfolioHistoryQuery.isError;
  const data = isError ? undefined : portfolioHistoryQuery.data;

  return (
    <div>
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as typeof activeTab);

          if (value === "totalValue") setTotalValueOpened((prev) => prev + 1);
          else if (value === "assets") setAssetsOpened((prev) => prev + 1);
          else if (value === "balance") setBalanceOpened((prev) => prev + 1);
        }}
      >
        <Card className="pb-0">
          {/* ===== HEADER ===== */}
          <CardHeader>
            <CardTitle className="flex flex-col gap-2 min-w-0">
              {/* ===== TITLE ===== */}
              <p className="font-mono text-sm font-normal uppercase text-muted-foreground">
                Portfolio Analytics
              </p>
              {/* ===== CURRENT VALUE ===== */}
              {portfolioHistoryQuery.isLoading && (
                <CustomSkeleton className="h-9 w-48" />
              )}
              {isError && (
                <p className="text-3xl font-bold tracking-tight text-muted-foreground/70">
                  —
                </p>
              )}
              {data && (
                <p className="text-3xl font-bold tracking-tight">
                  ${numToMoney(data[activeTab].at(-1)[1])}
                </p>
              )}
            </CardTitle>
            {/* ===== TABS ===== */}
            <CardAction>
              <TabsList>
                <TabsTrigger value="totalValue" className="cursor-pointer">
                  Total Value
                </TabsTrigger>
                <TabsTrigger value="assets" className="cursor-pointer">
                  Assets
                </TabsTrigger>
                <TabsTrigger value="balance" className="cursor-pointer">
                  Balance
                </TabsTrigger>
              </TabsList>
            </CardAction>
          </CardHeader>

          {/* ===== CHART + OHLC STATS ===== */}
          <TabsContents className="w-full">
            <TabsContent value="totalValue">
              {activeTab === "totalValue" &&
                (portfolioHistoryQuery.isLoading ? (
                  <ChartPanelSkeleton />
                ) : isError ? (
                  <ChartPanelError />
                ) : (
                  data && (
                    <PortfolioChartPanel
                      data={data.totalValue}
                      animation={totalValueOpened < 2}
                    />
                  )
                ))}
            </TabsContent>

            <TabsContent value="assets">
              {activeTab === "assets" &&
                (portfolioHistoryQuery.isLoading ? (
                  <ChartPanelSkeleton />
                ) : isError ? (
                  <ChartPanelError />
                ) : (
                  data && (
                    <PortfolioChartPanel
                      data={data.assets}
                      animation={assetsOpened < 2}
                    />
                  )
                ))}
            </TabsContent>

            <TabsContent value="balance">
              {activeTab === "balance" &&
                (portfolioHistoryQuery.isLoading ? (
                  <ChartPanelSkeleton />
                ) : isError ? (
                  <ChartPanelError />
                ) : (
                  data && (
                    <PortfolioChartPanel
                      data={data.balance}
                      animation={balanceOpened < 2}
                    />
                  )
                ))}
            </TabsContent>
          </TabsContents>
        </Card>
      </Tabs>
    </div>
  );
}
