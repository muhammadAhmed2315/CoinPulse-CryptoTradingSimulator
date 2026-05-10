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
import { StockChart } from "@highcharts/react/Stock";
import { AreaSeries } from "@highcharts/react/series/Area";
import { formatUnixToDayMonthYear, numToMoney } from "@/utils";

async function fetchPortfolioHistory() {
  const response = await fetch("http://localhost:5000/get_wallet_history", {
    method: "get",
    credentials: "include",
  });

  if (!response.ok) throw await response.json();

  return await response.json();
}

function findOHLC(values: [number, number][]) {
  if (values.length === 0) return {};

  const max = values.reduce((a, b) => (a[1] > b[1] ? a : b));
  const min = values.reduce((a, b) => (a[1] < b[1] ? a : b));

  return {
    open: {
      value: `£${numToMoney(values.at(0)![1])}`,
      timestamp: formatUnixToDayMonthYear(values.at(0)![0]),
    },
    high: {
      value: `£${numToMoney(max[1])}`,
      timestamp: formatUnixToDayMonthYear(max[0]),
    },
    low: {
      value: `£${numToMoney(min[1])}`,
      timestamp: formatUnixToDayMonthYear(min[0]),
    },
    close: {
      value: `£${numToMoney(values.at(-1)![1])}`,
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

  if (portfolioHistoryQuery.data) console.log(portfolioHistoryQuery.data);

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-2 min-w-0">
            <p className="font-mono text-sm font-normal uppercase text-muted-foreground">
              Portfolio Analytics
            </p>
            {portfolioHistoryQuery.data && (
              <p className="text-3xl font-bold tracking-tight">
                £{numToMoney(portfolioHistoryQuery.data[activeChart].at(-1)[1])}
              </p>
            )}
          </CardTitle>
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
            <StockChart
              options={{
                chart: { backgroundColor: "transparent" },
                rangeSelector: {
                  inputEnabled: false,
                  buttonPosition: { align: "right" },
                  buttonTheme: {
                    fill: "transparent",
                    stroke: "transparent",
                    "stroke-width": 0,
                    r: 6,
                    style: { color: "#999999", fontWeight: "500" },
                    states: {
                      hover: { fill: "#f4f4f5", style: { color: "#171717" } },
                      select: { fill: "#ffffff", style: { color: "#171717" } },
                    },
                  },
                },
                navigator: {
                  outlineWidth: 0,
                  maskFill: "rgba(17,17,17,0.06)",
                  handles: { backgroundColor: "#ffffff", borderColor: "#111" },
                  series: { color: "#111", lineWidth: 1.5, fillOpacity: 0.05 },
                },
                xAxis: {
                  lineColor: "transparent",
                  tickColor: "transparent",
                  crosshair: { color: "#111", width: 2, dashStyle: "Solid" },
                },
                yAxis: { gridLineColor: "#f0f0f0" },
                tooltip: {
                  split: false,
                  shared: false,
                  useHTML: true,
                  backgroundColor: "#111",
                  borderColor: "transparent",
                  borderRadius: 8,
                  borderWidth: 0,
                  shadow: false,
                  style: { color: "#fff" },
                  headerFormat: "",
                  pointFormatter: function () {
                    const date = new Date(this.x as number).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" },
                    );
                    return `<div style="font-size:10px;opacity:0.6;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px;">${date}</div><b>£${numToMoney(this.y as number)}</b>`;
                  },
                },
              }}
            >
              <AreaSeries
                data={portfolioHistoryQuery.data[activeChart].map(
                  ([timestamp, val]: [number, number]) => [
                    timestamp * 1000,
                    val,
                  ],
                )}
                options={{
                  lineColor: "#111",
                  lineWidth: 2,
                  color: "#111",
                  fillColor: {
                    linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                    stops: [
                      [0, "rgba(0,0,0,0.12)"],
                      [1, "rgba(0,0,0,0.01)"],
                    ],
                  },
                  threshold: null,
                  marker: {
                    fillColor: "#111",
                    lineColor: "#111",
                    states: {
                      hover: {
                        enabled: true,
                        fillColor: "#111",
                        lineColor: "#fff",
                        lineWidth: 2,
                        radius: 5,
                        radiusPlus: 0,
                      },
                    },
                  },
                  states: {
                    hover: { halo: { size: 6, opacity: 0.15 } },
                  },
                }}
              />
            </StockChart>
          )}
        </CardContent>

        <CardFooter className="flex flex-col p-0">
          <Separator className="bg-[#f0f0f0]" />
          <div className="grid grid-cols-4 w-full">
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
