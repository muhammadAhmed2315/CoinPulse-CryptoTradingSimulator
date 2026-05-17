import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "./ui/separator";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { formatUnixToDayMonthYear, numToMoney } from "@/utils";
import CustomAreaChart from "./CustomAreaChart";

// ===== API FUNCTIONS =====
async function fetchPortfolioHistory() {
  const response = await fetch("http://localhost:5000/get_wallet_history", {
    method: "get",
    credentials: "include",
  });

  if (!response.ok) throw await response.json();

  return await response.json();
}

// ===== HELPER FUNCTIONS =====
function findOHLC(values: [number, number][]) {
  if (values.length === 0) return {};

  const max = values.reduce((a, b) => (a[1] > b[1] ? a : b));
  const min = values.reduce((a, b) => (a[1] < b[1] ? a : b));

  return {
    open: {
      value: `$${numToMoney(values.at(0)![1])}`,
      timestamp: formatUnixToDayMonthYear(values.at(0)![0]),
    },
    high: {
      value: `$${numToMoney(max[1])}`,
      timestamp: formatUnixToDayMonthYear(max[0]),
    },
    low: {
      value: `$${numToMoney(min[1])}`,
      timestamp: formatUnixToDayMonthYear(min[0]),
    },
    close: {
      value: `$${numToMoney(values.at(-1)![1])}`,
      timestamp: formatUnixToDayMonthYear(values.at(-1)![0]),
    },
  };
}

export default function PortfolioAnalytics() {
  // ===== STATE VARIABLES =====
  const [activeChart, setActiveChart] = useState<
    "totalValue" | "assets" | "balance"
  >("totalValue");

  // ===== REACT QUERY HOOKS =====
  const portfolioHistoryQuery = useQuery({
    queryKey: ["portfolio-history"],
    queryFn: fetchPortfolioHistory,
  });

  // ===== DERIVED STATE =====
  const ohlcData = portfolioHistoryQuery.data
    ? {
        totalValue: findOHLC(portfolioHistoryQuery.data.assets),
        assets: findOHLC(portfolioHistoryQuery.data.balance),
        balance: findOHLC(portfolioHistoryQuery.data.totalValue),
      }
    : {};

  return (
    <div>
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
                ${numToMoney(portfolioHistoryQuery.data[activeChart].at(-1)[1])}
              </p>
            )}
          </CardTitle>
          {/* ===== TABS ===== */}
          <CardAction>
            <Tabs
              defaultValue="totalValue"
              onValueChange={(value) =>
                setActiveChart(value as typeof activeChart)
              }
            >
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
            </Tabs>
          </CardAction>
        </CardHeader>

        {/* ===== LINE CHART ===== */}
        <CardContent>
          {portfolioHistoryQuery.data && (
            <CustomAreaChart data={portfolioHistoryQuery.data[activeChart]} />
          )}
        </CardContent>

        {/* ===== OHLC STATS ===== */}
        <CardFooter className="flex flex-col p-0">
          <Separator className="bg-[#f0f0f0]" />
          <div className="grid grid-cols-4 w-full">
            {/* ===== OPEN ===== */}
            <div className="flex flex-col gap-1 px-6 py-4">
              <span className="font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Open
              </span>
              <span className="font-mono text-base font-bold">
                {ohlcData && ohlcData[activeChart]?.open?.value}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground -mt-1">
                {ohlcData && ohlcData[activeChart]?.open?.timestamp}
              </span>
            </div>

            {/* ===== HIGH ===== */}
            <div className="flex flex-col gap-1 px-6 py-4 border-l border-[#f0f0f0]">
              <span className="font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                High
              </span>
              <span className="font-mono text-base font-bold">
                {ohlcData && ohlcData[activeChart]?.high?.value}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground -mt-1">
                {ohlcData && ohlcData[activeChart]?.high?.timestamp}
              </span>
            </div>

            {/* ===== LOW ===== */}
            <div className="flex flex-col gap-1 px-6 py-4 border-l border-[#f0f0f0]">
              <span className="font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Low
              </span>
              <span className="font-mono text-base font-bold">
                {ohlcData && ohlcData[activeChart]?.low?.value}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground -mt-1">
                {ohlcData && ohlcData[activeChart]?.low?.timestamp}
              </span>
            </div>

            {/* ===== CLOSE ===== */}
            <div className="flex flex-col gap-1 px-6 py-4 border-l border-[#f0f0f0]">
              <span className="font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Close
              </span>
              <span className="font-mono text-base font-bold">
                {ohlcData && ohlcData[activeChart]?.close?.value}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground -mt-1">
                {ohlcData && ohlcData[activeChart]?.close?.timestamp}
              </span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

// NEW GRAPH SETTINGS:
// Line: #111
// Fill top: rgba(0,0,0,0.12)
// Fill bottom: rgba(0,0,0,0.01)
// Black background hover boxes with white text
// #999999 for the 1m 3m 6m ytd 1y all labels
