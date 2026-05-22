import { Separator } from "./ui/separator";
import { formatUnixToDayMonthYear, numToMoney } from "@/utils";
import CustomAreaChart from "./CustomAreaChart";

type OHLCEntry = { value: string; timestamp: string };
type OHLC = {
  open?: OHLCEntry;
  high?: OHLCEntry;
  low?: OHLCEntry;
  close?: OHLCEntry;
};

function findOHLC(values: [number, number][]): OHLC {
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

type OHLCStatProps = {
  label: string;
  entry?: OHLCEntry;
  withDivider?: boolean;
};

function OHLCStat({ label, entry, withDivider }: OHLCStatProps) {
  return (
    <div
      className={`flex flex-col gap-1 px-6 py-4 ${
        withDivider ? "border-l border-[#f0f0f0]" : ""
      }`}
    >
      <span className="font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-base font-bold">{entry?.value}</span>
      <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground -mt-1">
        {entry?.timestamp}
      </span>
    </div>
  );
}

type PortfolioChartPanelProps = {
  data: [number, number][];
  animation?: boolean;
};

export default function PortfolioChartPanel({
  data,
  animation = true,
}: PortfolioChartPanelProps) {
  const ohlc = findOHLC(data);

  return (
    <>
      {/* ===== LINE CHART ===== */}
      <div className="px-6">
        <CustomAreaChart data={data} animation={animation} />
      </div>

      {/* ===== OHLC STATS ===== */}
      <Separator className="bg-[#f0f0f0]" />
      <div className="grid grid-cols-4 w-full">
        <OHLCStat label="Open" entry={ohlc.open} />
        <OHLCStat label="High" entry={ohlc.high} withDivider />
        <OHLCStat label="Low" entry={ohlc.low} withDivider />
        <OHLCStat label="Close" entry={ohlc.close} withDivider />
      </div>
    </>
  );
}
