import { StockChart } from "@highcharts/react/Stock";
import { AreaSeries } from "@highcharts/react/series/Area";
import { numToMoney } from "@/utils";
import { useTheme } from "@/context/theme-context";
import { buildChartPalette } from "@/lib/chart-theme";
import { useMemo } from "react";

// ===== TYPES =====
type CustomAreaChartProps = {
  data: [number, number][];
  height?: string | undefined;
  colored?: boolean;
  animation?: boolean;
};

export default function CustomAreaChart({
  data,
  height = undefined,
  colored = false,
  animation = true,
}: CustomAreaChartProps) {
  // ===== THEME =====
  const { resolvedTheme } = useTheme();
  const palette = useMemo(
    () => buildChartPalette(resolvedTheme),
    [resolvedTheme],
  );

  // ===== DERIVED STATE =====
  const trendColor =
    data.length > 1 && data.at(-1)![1] < data[0][1] ? palette.down : palette.up;
  const lineColor = colored ? trendColor : palette.neutralLine;
  const neutralFillStops: [number, string][] =
    resolvedTheme === "dark"
      ? [
          [0, "rgba(212, 212, 216, 0.18)"],
          [1, "rgba(212, 212, 216, 0)"],
        ]
      : [
          [0, "rgba(113, 113, 122, 0.28)"],
          [1, "rgba(113, 113, 122, 0)"],
        ];
  const fillStops: [number, string][] = colored
    ? [
        [
          0,
          trendColor === palette.up
            ? "rgba(33, 196, 93, 0.22)"
            : "rgba(239, 68, 68, 0.22)",
        ],
        [
          1,
          trendColor === palette.up
            ? "rgba(33, 196, 93, 0)"
            : "rgba(239, 68, 68, 0)",
        ],
      ]
    : neutralFillStops;
  const chartData: [number, number][] = data.map(([timestamp, val]) => [
    timestamp > 10_000_000_000 ? timestamp : timestamp * 1000,
    val,
  ]);

  return (
    <StockChart
      options={{
        chart: {
          backgroundColor: "transparent",
          height: height,
          style: { fontFamily: "DM Sans, sans-serif" },
          spacing: [12, 0, 8, 0],
          animation: false,
        },
        plotOptions: { series: { animation: animation } },
        credits: { enabled: false },
        accessibility: { enabled: false },
        rangeSelector: {
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
          ],
        },
        navigator: {
          enabled: true,
          height: 62,
          margin: 12,
          maskFill:
            resolvedTheme === "dark"
              ? "rgba(212, 212, 216, 0.08)"
              : "rgba(113, 113, 122, 0.10)",
          outlineColor: palette.border,
          outlineWidth: 1,
          series: {
            type: "areaspline",
            color: lineColor,
            lineColor: lineColor,
            lineWidth: 1,
            fillColor: {
              linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
              stops: fillStops,
            },
          },
          handles: {
            backgroundColor: palette.selectFill,
            borderColor: palette.muted,
          },
          xAxis: {
            gridLineColor: palette.grid,
            labels: {
              style: {
                color: palette.muted,
                fontFamily: "IBM Plex Mono, monospace",
                fontSize: "9px",
                letterSpacing: "0.04em",
              },
            },
          },
          // Scale the navigator y-axis by 1.5x so the series only fills
          // ~2/3 of the navigator's height instead of reaching the top.
          yAxis: { maxPadding: 0.5 },
        },
        scrollbar: { enabled: false },
        legend: { enabled: false },
        xAxis: {
          type: "datetime",
          lineColor: palette.border,
          tickColor: palette.border,
          crosshair: { color: palette.crosshair, width: 2, dashStyle: "Solid" },
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
          split: false,
          shared: false,
          useHTML: true,
          backgroundColor: palette.tooltipBg,
          borderColor: "transparent",
          borderRadius: 8,
          borderWidth: 0,
          shadow: false,
          style: {
            color: palette.tooltipText,
            fontFamily: "IBM Plex Mono, monospace",
            fontSize: "11px",
          },
          headerFormat: "",
          pointFormatter: function () {
            const date = new Date(this.x as number).toLocaleDateString(
              "en-US",
              { month: "short", day: "numeric", year: "numeric" },
            );
            return `<div style="font-size:10px;opacity:0.6;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:2px;">${date}</div><b>$${numToMoney(this.y as number)}</b>`;
          },
        },
      }}
    >
      <AreaSeries
        data={chartData}
        options={{
          lineColor: lineColor,
          lineWidth: colored ? 1.6 : 2,
          color: lineColor,
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: fillStops,
          },
          threshold: null,
          marker: { enabled: false },
          states: {
            hover: { halo: { size: 6, opacity: 0.15 } },
          },
        }}
      />
    </StockChart>
  );
}
