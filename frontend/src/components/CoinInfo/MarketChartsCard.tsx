import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "@/components/animate-ui/components/animate/tabs";
import { Card } from "@/components/ui/card";
import { StockChart } from "@highcharts/react/Stock";
import { CandlestickSeries } from "@highcharts/react/series/Candlestick";
import { useQuery } from "@tanstack/react-query";
import { ColumnSeries } from "@highcharts/react/series/Column";
import type Highcharts from "highcharts";
import { useState } from "react";
import CustomAreaChart from "../CustomAreaChart";
import { numToMoney } from "@/utils";

// ===== SHARED RANGE SELECTOR CONFIG =====
const rangeSelectorConfig: Highcharts.RangeSelectorOptions = {
  enabled: true,
  selected: 5,
  inputEnabled: false,
  labelStyle: { display: "none" },
  buttonPosition: { align: "right" },
  buttonSpacing: 2,
  buttonTheme: {
    fill: "transparent",
    stroke: "none",
    r: 6,
    padding: 6,
    style: {
      color: "#71717a",
      fontFamily: "IBM Plex Mono, monospace",
      fontSize: "10px",
      fontWeight: "600",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
    },
    states: {
      hover: { fill: "transparent", style: { color: "#111111" } },
      select: {
        fill: "#f5f5f5",
        style: { color: "#111111", fontWeight: "600" },
      },
    },
  },
  buttons: [
    { type: "month", count: 1, text: "1M" },
    { type: "month", count: 3, text: "3M" },
    { type: "month", count: 6, text: "6M" },
    { type: "ytd", text: "YTD" },
    { type: "year", count: 1, text: "1Y" },
    { type: "all", text: "ALL" },
  ] as Highcharts.RangeSelectorButtonsOptions[],
};

// ===== TYPES =====
type MarketChartsCardProps = {
  currCoin: {
    id: string;
    name: string;
    ticker: string;
  };
};

// ===== API FUNCTIONS =====
async function getOhlcChart(coin_id: string) {
  const response = await fetch(
    `http://localhost:5000/get_coin_OHLC_data/${coin_id}`,
    {
      method: "get",
      credentials: "include",
    },
  );

  if (!response.ok) throw await response.json();

  return await response.json();
}

async function getCoinCharts(coin_id: string) {
  const response = await fetch(
    `http://localhost:5000/get_coin_historical_data/${coin_id}`,
    {
      method: "get",
      credentials: "include",
    },
  );

  if (!response.ok) throw await response.json();

  return await response.json();
}

// ===== CONSTANTS =====
const tabTypeMapping = {
  ohlc: "OHLC Chart",
  price: "Price Chart",
  marketCap: "Market Cap Chart",
  volume: "Volume Chart",
};

export default function MarketChartsCard({ currCoin }: MarketChartsCardProps) {
  // ===== STATE VARIABLES =====
  const [activeTab, setActiveTab] = useState<
    "ohlc" | "price" | "marketCap" | "volume"
  >("ohlc");

  // ===== REACT QUERY HOOKS =====
  const ohlcChartQuery = useQuery({
    queryKey: ["ohlc-chart", currCoin.id],
    queryFn: () => getOhlcChart(currCoin.id),
  });

  const coinChartsQuery = useQuery({
    queryKey: ["coin-charts", currCoin.id],
    queryFn: () => getCoinCharts(currCoin.id),
  });

  // ===== STYLES =====
  const tabTriggerClass =
    "cursor-pointer font-mono text-[11px] font-semibold uppercase tracking-[0.06em] px-[14px] py-[7px] rounded-[7px]";

  return (
    <Card className="flex-7 p-0 gap-0 overflow-hidden rounded-[18px] border-[#f0f0f0] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {/* ===== HEADER ===== */}
      <div className="px-6 pt-5.5 pb-4.5 border-b border-[#f0f0f0]">
        <div className="flex flex-col gap-2">
          {/* ===== EYEBROW ===== */}
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] leading-none text-[#71717a]">
            Market Charts
          </span>
          {/* ===== TITLE ===== */}
          <h2 className="m-0 text-[22px] font-bold leading-none tracking-[-0.015em] text-[#111111]">
            {currCoin.name} {tabTypeMapping[activeTab]}
          </h2>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) =>
          setActiveTab(v as "ohlc" | "price" | "marketCap" | "volume")
        }
        className="gap-0"
      >
        {/* ===== TABS LIST ===== */}
        <div className="px-6 py-4 border-b border-[#f0f0f0]">
          <TabsList className="h-auto bg-[#fafafa] border border-[#ececef] rounded-[10px] p-1">
            <TabsTrigger value="ohlc" className={tabTriggerClass}>
              OHLC
            </TabsTrigger>
            <TabsTrigger value="price" className={tabTriggerClass}>
              PRICE
            </TabsTrigger>
            <TabsTrigger value="marketCap" className={tabTriggerClass}>
              MARKET CAP
            </TabsTrigger>
            <TabsTrigger value="volume" className={tabTriggerClass}>
              VOLUME
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ===== CHART CONTENT ===== */}
        <TabsContents className="px-3 pt-2 pb-4">
          {/* ===== OHLC CHART ===== */}
          <TabsContent value="ohlc" className="h-full flex flex-col gap-6">
            {ohlcChartQuery.data ? (
              <div>
                <StockChart
                  options={{
                    chart: {
                      height: "45%",
                      backgroundColor: "transparent",
                      style: { fontFamily: "DM Sans, sans-serif" },
                      spacing: [12, 0, 8, 0],
                    },
                    credits: { enabled: false },
                    accessibility: { enabled: false },
                    rangeSelector: rangeSelectorConfig,
                    navigator: { enabled: false },
                    scrollbar: { enabled: false },
                    legend: { enabled: false },
                    xAxis: {
                      lineColor: "#f0f0f0",
                      tickColor: "#f0f0f0",
                      labels: {
                        style: {
                          color: "#71717a",
                          fontFamily: "IBM Plex Mono, monospace",
                          fontSize: "10px",
                          letterSpacing: "0.04em",
                        },
                      },
                    },
                    yAxis: {
                      gridLineColor: "#f0f0f0",
                      labels: {
                        style: {
                          color: "#71717a",
                          fontFamily: "IBM Plex Mono, monospace",
                          fontSize: "10px",
                          letterSpacing: "0.04em",
                        },
                      },
                      title: { text: undefined },
                    },
                    tooltip: {
                      backgroundColor: "#111",
                      borderWidth: 0,
                      borderRadius: 8,
                      shadow: false,
                      style: {
                        color: "#fff",
                        fontFamily: "IBM Plex Mono, monospace",
                        fontSize: "11px",
                      },
                      useHTML: true,
                      formatter: function () {
                        const p = this.points?.[0]?.point ?? this.point;
                        return `
                          <div style="font-weight:700;margin-bottom:6px">${currCoin.ticker.toUpperCase()}</div>
                          <div>Open:&nbsp;&nbsp;<b>$${numToMoney(p.open)}</b></div>
                          <div>High:&nbsp;&nbsp;<b>$${numToMoney(p.high)}</b></div>
                          <div>Low:&nbsp;&nbsp;&nbsp;<b>$${numToMoney(p.low)}</b></div>
                          <div>Close:&nbsp;<b>$${numToMoney(p.close)}</b></div>
                        `;
                      },
                    },
                    plotOptions: {
                      candlestick: {
                        color: "#ef4444",
                        upColor: "#21c45d",
                        lineColor: "#ef4444",
                        upLineColor: "#21c45d",
                      },
                    },
                  }}
                >
                  <CandlestickSeries
                    name={currCoin.ticker.toUpperCase()}
                    data={ohlcChartQuery.data}
                  />
                </StockChart>
              </div>
            ) : (
              <>Loading...</>
            )}
          </TabsContent>

          {/* ===== PRICE CHART ===== */}
          <TabsContent value="price" className="flex flex-col gap-6">
            <div>
              {coinChartsQuery.data ? (
                <CustomAreaChart
                  data={coinChartsQuery.data.prices}
                  height="45%"
                  colored
                />
              ) : (
                <p>Loading...</p>
              )}
            </div>
          </TabsContent>

          {/* ===== MARKET CAP CHART ===== */}
          <TabsContent value="marketCap" className="flex flex-col gap-6">
            {coinChartsQuery.data ? (
              <div>
                <CustomAreaChart
                  data={coinChartsQuery.data.market_caps}
                  height="45%"
                  colored
                />
              </div>
            ) : (
              <p>Loading...</p>
            )}
          </TabsContent>

          {/* ===== VOLUME CHART ===== */}
          <TabsContent value="volume" className="flex flex-col gap-6">
            {coinChartsQuery.data ? (
              <div>
                <StockChart
                  options={{
                    chart: {
                      height: "45%",
                      backgroundColor: "transparent",
                      style: { fontFamily: "DM Sans, sans-serif" },
                      spacing: [12, 0, 8, 0],
                    },
                    credits: { enabled: false },
                    accessibility: { enabled: false },
                    rangeSelector: rangeSelectorConfig,
                    navigator: { enabled: false },
                    scrollbar: { enabled: false },
                    legend: { enabled: false },
                    xAxis: {
                      type: "datetime",
                      lineColor: "#f0f0f0",
                      tickColor: "#f0f0f0",
                      labels: {
                        style: {
                          color: "#71717a",
                          fontFamily: "IBM Plex Mono, monospace",
                          fontSize: "10px",
                          letterSpacing: "0.04em",
                        },
                      },
                    },
                    yAxis: {
                      gridLineColor: "#f0f0f0",
                      labels: {
                        style: {
                          color: "#71717a",
                          fontFamily: "IBM Plex Mono, monospace",
                          fontSize: "10px",
                          letterSpacing: "0.04em",
                        },
                      },
                      title: { text: undefined },
                    },
                    tooltip: {
                      backgroundColor: "#111",
                      borderWidth: 0,
                      borderRadius: 8,
                      shadow: false,
                      style: {
                        color: "#fff",
                        fontFamily: "IBM Plex Mono, monospace",
                        fontSize: "11px",
                      },
                    },
                    plotOptions: {
                      column: {
                        color: "#a0a0a0",
                        borderWidth: 0,
                        pointPadding: 0.05,
                        groupPadding: 0.05,
                      },
                    },
                  }}
                >
                  <ColumnSeries
                    name="Volume"
                    data={coinChartsQuery.data.total_volumes}
                  />
                </StockChart>
              </div>
            ) : (
              <>Loading...</>
            )}
          </TabsContent>
        </TabsContents>
      </Tabs>
    </Card>
  );
}
