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

// ===== NAVBAR PREFETCH =====
export function prefetchPortfolioAnalytics(queryClient: QueryClient) {
  return Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["portfolio-history"],
      queryFn: fetchPortfolioHistory,
      staleTime: 30_000,
    }),
  ]);
}

// ===== API FUNCTIONS =====
async function fetchPortfolioHistory() {
  const response = await fetch("http://localhost:5000/get_wallet_history", {
    method: "get",
    credentials: "include",
  });

  if (!response.ok) throw await response.json();

  return await response.json();
}

export default function PortfolioAnalytics() {
  // ===== STATE VARIABLES =====
  const [activeTab, setActiveTab] = useState<
    "totalValue" | "assets" | "balance"
  >("totalValue");
  const [hoveredTab, setHoveredTab] = useState<
    "totalValue" | "assets" | "balance" | undefined
  >(undefined);
  const [totalValueOpened, setTotalValueOpened] = useState(1);
  const [assetsOpened, setAssetsOpened] = useState(0);
  const [balanceOpened, setBalanceOpened] = useState(0);

  // ===== REACT QUERY HOOKS =====
  const portfolioHistoryQuery = useQuery({
    queryKey: ["portfolio-history"],
    queryFn: fetchPortfolioHistory,
  });

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
              {portfolioHistoryQuery.data && (
                <p className="text-3xl font-bold tracking-tight">
                  ${numToMoney(portfolioHistoryQuery.data[activeTab].at(-1)[1])}
                </p>
              )}
            </CardTitle>
            {/* ===== TABS ===== */}
            <CardAction>
              <TabsList>
                <TabsTrigger
                  value="totalValue"
                  className="cursor-pointer"
                  onHoverStart={() => setHoveredTab("totalValue")}
                  onHoverEnd={() => setHoveredTab(undefined)}
                >
                  Total Value
                </TabsTrigger>
                <TabsTrigger
                  value="assets"
                  className="cursor-pointer"
                  onHoverStart={() => setHoveredTab("assets")}
                  onHoverEnd={() => setHoveredTab(undefined)}
                >
                  Assets
                </TabsTrigger>
                <TabsTrigger
                  value="balance"
                  className="cursor-pointer"
                  onHoverStart={() => setHoveredTab("balance")}
                  onHoverEnd={() => setHoveredTab(undefined)}
                >
                  Balance
                </TabsTrigger>
              </TabsList>
            </CardAction>
          </CardHeader>

          {/* ===== CHART + OHLC STATS ===== */}
          <TabsContents className="w-full">
            <TabsContent value="totalValue">
              {portfolioHistoryQuery.data &&
                (activeTab === "totalValue" || hoveredTab === "totalValue") && (
                  <PortfolioChartPanel
                    data={portfolioHistoryQuery.data.totalValue}
                    animation={totalValueOpened < 2}
                  />
                )}
            </TabsContent>

            <TabsContent value="assets">
              {portfolioHistoryQuery.data &&
                (activeTab === "assets" || hoveredTab === "assets") && (
                  <PortfolioChartPanel
                    data={portfolioHistoryQuery.data.assets}
                    animation={assetsOpened < 2}
                  />
                )}
            </TabsContent>

            <TabsContent value="balance">
              {portfolioHistoryQuery.data &&
                (activeTab === "balance" || hoveredTab === "balance") && (
                  <PortfolioChartPanel
                    data={portfolioHistoryQuery.data.balance}
                    animation={balanceOpened < 2}
                  />
                )}
            </TabsContent>
          </TabsContents>
        </Card>
      </Tabs>
    </div>
  );
}
