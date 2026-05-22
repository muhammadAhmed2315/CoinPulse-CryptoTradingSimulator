import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "@/components/animate-ui/components/animate/tabs";
import { Card, CardAction, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { numToMoney } from "@/utils";
import PortfolioChartPanel from "./PortfolioChartPanel";

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
        <Card>
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
              {portfolioHistoryQuery.data && activeTab === "totalValue" && (
                <PortfolioChartPanel
                  data={portfolioHistoryQuery.data.totalValue}
                  animation={totalValueOpened < 2}
                />
              )}
            </TabsContent>

            <TabsContent value="assets">
              {portfolioHistoryQuery.data && activeTab === "assets" && (
                <PortfolioChartPanel
                  data={portfolioHistoryQuery.data.assets}
                  animation={assetsOpened < 2}
                />
              )}
            </TabsContent>

            <TabsContent value="balance">
              {portfolioHistoryQuery.data && activeTab === "balance" && (
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

// NEW GRAPH SETTINGS:
// Line: #111
// Fill top: rgba(0,0,0,0.12)
// Fill bottom: rgba(0,0,0,0.01)
// Black background hover boxes with white text
// #999999 for the 1m 3m 6m ytd 1y all labels
