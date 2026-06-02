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
import { QueryClient, useQuery } from "@tanstack/react-query";
import { ColumnSeries } from "@highcharts/react/series/Column";
import type Highcharts from "highcharts";
import { useState } from "react";
import CustomAreaChart from "../CustomAreaChart";
import { numToMoney } from "@/utils";
import { useInView } from "react-intersection-observer";
import { fetchWithRefresh, API_BASE } from "@/lib/api";
import CustomSkeleton from "../CustomSkeleton";
import ErrorFallback from "../ErrorFallback";
import { useTheme } from "@/context/theme-context";
import { buildChartPalette, type ChartPalette } from "@/lib/chart-theme";
import { useMemo } from "react";
import NewTradeButton from "../NewTrade/NewTradeButton";

// OHLC values exposed on each point of the Highcharts candlestick tooltip context.
type CandlestickPoint = {
  open: number;
  high: number;
  low: number;
  close: number;
};

// ===== CHART SKELETON =====
function ChartSkeleton() {
  return <CustomSkeleton className="h-[557.75px] w-full" />;
}

// ===== NAVBAR PREFETCH =====
export function prefetchMarketChartsCard(
  queryClient: QueryClient,
  coinId: string = "bitcoin",
) {
  return Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["ohlcChart", coinId],
      queryFn: () => getOhlcChart(coinId),
    }),
    queryClient.prefetchQuery({
      queryKey: ["coinCharts", coinId],
      queryFn: () => getCoinCharts(coinId),
    }),
  ]);
}

// ===== SHARED RANGE SELECTOR CONFIG =====
function buildRangeSelectorConfig(
  palette: ChartPalette,
): Highcharts.RangeSelectorOptions {
  return {
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
        color: palette.muted,
        fontFamily: "IBM Plex Mono, monospace",
        fontSize: "10px",
        fontWeight: "600",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      },
      states: {
        hover: {
          fill: "transparent",
          style: { color: palette.hoverText },
        },
        select: {
          fill: palette.selectFill,
          style: { color: palette.hoverText, fontWeight: "600" },
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
}

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
  const response = await fetchWithRefresh(
    `${API_BASE}/get_coin_OHLC_data/${coin_id}`,
    {
      method: "get",
      credentials: "include",
    },
  );

  if (!response.ok) throw await response.json();

  return await response.json();
}

async function getCoinCharts(coin_id: string) {
  const response = await fetchWithRefresh(
    `${API_BASE}/get_coin_historical_data/${coin_id}`,
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
  // ===== THEME =====
  const { resolvedTheme } = useTheme();
  const palette = useMemo(
    () => buildChartPalette(resolvedTheme),
    [resolvedTheme],
  );
  const rangeSelectorConfig = useMemo(
    () => buildRangeSelectorConfig(palette),
    [palette],
  );

  // ===== STATE VARIABLES =====
  const [activeTab, setActiveTab] = useState<
    "ohlc" | "price" | "marketCap" | "volume"
  >("ohlc");
  const [hoveredTab, setHoveredTab] = useState<
    "ohlc" | "price" | "marketCap" | "volume" | undefined
  >(undefined);
  const [ohlcOpened, setOhlcOpened] = useState(0);
  const [priceOpened, setPriceOpened] = useState(0);
  const [marketCapOpened, setMarketCapOpened] = useState(0);
  const [volumeOpened, setVolumeOpened] = useState(0);

  // ===== INTERSECTION OBSERVER =====
  const [ohlcRef, ohlcInView] = useInView();
  const [priceRef, priceInView] = useInView();
  const [marketCapRef, marketCapInView] = useInView();
  const [volumeRef, volumeInView] = useInView();

  // ===== REACT QUERY HOOKS =====
  const ohlcChartQuery = useQuery({
    queryKey: ["ohlcChart", currCoin.id],
    queryFn: () => getOhlcChart(currCoin.id),
    staleTime: 30_000,
  });

  const coinChartsQuery = useQuery({
    queryKey: ["coinCharts", currCoin.id],
    queryFn: () => getCoinCharts(currCoin.id),
    staleTime: 30_000,
  });

  // ===== STYLES =====
  const tabTriggerClass =
    "cursor-pointer font-mono text-[11px] font-semibold uppercase tracking-[0.06em] px-[14px] py-[7px] rounded-[7px]";

  return (
    <Card className="flex-7 p-0 gap-0 overflow-hidden rounded-[18px] border-border shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {/* ===== HEADER ===== */}
      <div className="px-6 pt-5.5 pb-4.5 border-b border-border flex justify-between">
        <div className="flex flex-col gap-2">
          {/* ===== EYEBROW ===== */}
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] leading-none text-muted-foreground">
            Market Charts
          </span>
          {/* ===== TITLE ===== */}
          <h2 className="m-0 text-[22px] font-bold leading-none tracking-[-0.015em] text-foreground">
            {currCoin.name} {tabTypeMapping[activeTab]}
          </h2>
        </div>
        <NewTradeButton initialCoin={currCoin} />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as "ohlc" | "price" | "marketCap" | "volume");

          if (v === "ohlc") setOhlcOpened((prev) => prev + 1);
          else if (v === "price") setPriceOpened((prev) => prev + 1);
          else if (v === "marketCap") setMarketCapOpened((prev) => prev + 1);
          else if (v === "volume") setVolumeOpened((prev) => prev + 1);
        }}
        className="gap-0"
      >
        {/* ===== TABS LIST ===== */}
        <div className="px-6 py-4 border-b border-border">
          <TabsList className="h-auto bg-muted border border-border rounded-[10px] p-1">
            <TabsTrigger
              value="ohlc"
              className={tabTriggerClass}
              onHoverStart={() => setHoveredTab("ohlc")}
              onHoverEnd={() => setHoveredTab(undefined)}
            >
              OHLC
            </TabsTrigger>
            <TabsTrigger
              value="price"
              className={tabTriggerClass}
              onHoverStart={() => setHoveredTab("price")}
              onHoverEnd={() => setHoveredTab(undefined)}
            >
              PRICE
            </TabsTrigger>
            <TabsTrigger
              value="marketCap"
              className={tabTriggerClass}
              onHoverStart={() => setHoveredTab("marketCap")}
              onHoverEnd={() => setHoveredTab(undefined)}
            >
              MARKET CAP
            </TabsTrigger>
            <TabsTrigger
              value="volume"
              className={tabTriggerClass}
              onHoverStart={() => setHoveredTab("volume")}
              onHoverEnd={() => setHoveredTab(undefined)}
            >
              VOLUME
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ===== CHART CONTENT ===== */}
        <TabsContents className="px-3 pt-2 pb-4">
          {/* ===== OHLC CHART ===== */}
          <TabsContent
            value="ohlc"
            className="h-full flex flex-col gap-6"
            ref={ohlcRef}
          >
            {ohlcChartQuery.isError ? (
              <ErrorFallback
                title="Data unavailable"
                description="OHLC chart could not be loaded."
                className="h-[557.75px]"
              />
            ) : ohlcChartQuery.data && (ohlcInView || hoveredTab === "ohlc") ? (
              <div>
                <StockChart
                  options={{
                    chart: {
                      height: "45%",
                      backgroundColor: "transparent",
                      style: { fontFamily: "DM Sans, sans-serif" },
                      spacing: [12, 0, 8, 0],
                      animation: false,
                    },
                    credits: { enabled: false },
                    accessibility: { enabled: false },
                    rangeSelector: rangeSelectorConfig,
                    navigator: { enabled: false },
                    scrollbar: { enabled: false },
                    legend: { enabled: false },
                    xAxis: {
                      lineColor: palette.border,
                      tickColor: palette.border,
                      labels: {
                        style: {
                          color: palette.muted,
                          fontFamily: "IBM Plex Mono, monospace",
                          fontSize: "10px",
                          letterSpacing: "0.04em",
                        },
                      },
                    },
                    yAxis: {
                      gridLineColor: palette.grid,
                      labels: {
                        style: {
                          color: palette.muted,
                          fontFamily: "IBM Plex Mono, monospace",
                          fontSize: "10px",
                          letterSpacing: "0.04em",
                        },
                      },
                      title: { text: undefined },
                    },
                    tooltip: {
                      backgroundColor: palette.tooltipBg,
                      borderWidth: 0,
                      borderRadius: 8,
                      shadow: false,
                      style: {
                        color: palette.tooltipText,
                        fontFamily: "IBM Plex Mono, monospace",
                        fontSize: "11px",
                      },
                      useHTML: true,
                      formatter: function () {
                        const ctx = this as unknown as {
                          points?: { point: CandlestickPoint }[];
                          point: CandlestickPoint;
                        };
                        const p = ctx.points?.[0]?.point ?? ctx.point;
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
                        color: palette.down,
                        upColor: palette.up,
                        lineColor: palette.down,
                        upLineColor: palette.up,
                      },
                      series: {
                        animation: ohlcOpened < 2,
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
              <ChartSkeleton />
            )}
          </TabsContent>

          {/* ===== PRICE CHART ===== */}
          <TabsContent
            value="price"
            className="flex flex-col gap-6"
            ref={priceRef}
          >
            {coinChartsQuery.isError ? (
              <ErrorFallback
                title="Data unavailable"
                description="Price chart could not be loaded."
                className="h-[557.75px]"
              />
            ) : coinChartsQuery.data &&
              (priceInView || hoveredTab === "price") ? (
              <div>
                <CustomAreaChart
                  animation={priceOpened < 2}
                  colored
                  data={coinChartsQuery.data.prices}
                  height="45%"
                />
              </div>
            ) : (
              <ChartSkeleton />
            )}
          </TabsContent>

          {/* ===== MARKET CAP CHART ===== */}
          <TabsContent
            value="marketCap"
            className="flex flex-col gap-6"
            ref={marketCapRef}
          >
            {coinChartsQuery.isError ? (
              <ErrorFallback
                title="Data unavailable"
                description="Market cap chart could not be loaded."
                className="h-[557.75px]"
              />
            ) : coinChartsQuery.data &&
              (marketCapInView || hoveredTab === "marketCap") ? (
              <div>
                <CustomAreaChart
                  animation={marketCapOpened < 2}
                  colored
                  data={coinChartsQuery.data.market_caps}
                  height="45%"
                />
              </div>
            ) : (
              <ChartSkeleton />
            )}
          </TabsContent>

          {/* ===== VOLUME CHART ===== */}
          <TabsContent
            value="volume"
            className="flex flex-col gap-6"
            ref={volumeRef}
          >
            {coinChartsQuery.isError ? (
              <ErrorFallback
                title="Data unavailable"
                description="Volume chart could not be loaded."
                className="h-[557.75px]"
              />
            ) : coinChartsQuery.data &&
              (volumeInView || hoveredTab === "volume") ? (
              <div>
                <StockChart
                  options={{
                    chart: {
                      height: "45%",
                      backgroundColor: "transparent",
                      style: { fontFamily: "DM Sans, sans-serif" },
                      spacing: [12, 0, 8, 0],
                      animation: false,
                    },
                    credits: { enabled: false },
                    accessibility: { enabled: false },
                    rangeSelector: rangeSelectorConfig,
                    navigator: { enabled: false },
                    scrollbar: { enabled: false },
                    legend: { enabled: false },
                    xAxis: {
                      type: "datetime",
                      lineColor: palette.border,
                      tickColor: palette.border,
                      labels: {
                        style: {
                          color: palette.muted,
                          fontFamily: "IBM Plex Mono, monospace",
                          fontSize: "10px",
                          letterSpacing: "0.04em",
                        },
                      },
                    },
                    yAxis: {
                      gridLineColor: palette.grid,
                      labels: {
                        style: {
                          color: palette.muted,
                          fontFamily: "IBM Plex Mono, monospace",
                          fontSize: "10px",
                          letterSpacing: "0.04em",
                        },
                      },
                      title: { text: undefined },
                    },
                    tooltip: {
                      backgroundColor: palette.tooltipBg,
                      borderWidth: 0,
                      borderRadius: 8,
                      shadow: false,
                      style: {
                        color: palette.tooltipText,
                        fontFamily: "IBM Plex Mono, monospace",
                        fontSize: "11px",
                      },
                    },
                    plotOptions: {
                      column: {
                        color: palette.muted,
                        borderWidth: 0,
                        pointPadding: 0.05,
                        groupPadding: 0.05,
                      },
                      series: {
                        animation: volumeOpened < 2,
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
              <ChartSkeleton />
            )}
          </TabsContent>
        </TabsContents>
      </Tabs>
    </Card>
  );
}
