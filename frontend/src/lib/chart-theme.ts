export type ChartPalette = {
  background: string;
  text: string;
  muted: string;
  neutralLine: string;
  border: string;
  grid: string;
  crosshair: string;
  hoverText: string;
  selectFill: string;
  tooltipBg: string;
  tooltipText: string;
  up: string;
  down: string;
};

export function buildChartPalette(
  resolvedTheme: "light" | "dark",
): ChartPalette {
  if (resolvedTheme === "dark") {
    return {
      background: "transparent",
      text: "#fafafa",
      muted: "#a1a1aa",
      neutralLine: "#d4d4d8",
      border: "#27272a",
      grid: "#27272a",
      crosshair: "#fafafa",
      hoverText: "#fafafa",
      selectFill: "#27272a",
      tooltipBg: "#fafafa",
      tooltipText: "#0a0a0a",
      up: "#21c45d",
      down: "#ef4444",
    };
  }
  return {
    background: "transparent",
    text: "#111111",
    muted: "#71717a",
    neutralLine: "#71717a",
    border: "#f0f0f0",
    grid: "#f0f0f0",
    crosshair: "#111111",
    hoverText: "#111111",
    selectFill: "#f5f5f5",
    tooltipBg: "#111111",
    tooltipText: "#ffffff",
    up: "#21c45d",
    down: "#ef4444",
  };
}
