import CustomSkeleton from "@/components/CustomSkeleton";
import { useState } from "react";

const COLORS = [
  "#000000",
  "#1a1a1a",
  "#333333",
  "#4d4d4d",
  "#666666",
  "#808080",
  "#999999",
  "#b3b3b3",
  "#cccccc",
];

function convertHoldingsToPercentages(
  holdings: { id: string; ticker: string; totalValue: number }[],
) {
  const totalHoldingsValue = holdings.reduce((acc, coin) => {
    return acc + coin.totalValue;
  }, 0);

  const holdingsWithPercentages = holdings.map((coin, i) => ({
    ...coin,
    percentage: (coin.totalValue / totalHoldingsValue) * 100,
    color: COLORS[i * Math.floor(COLORS.length / holdings.length)],
  }));

  if (holdingsWithPercentages.length <= 8) return holdingsWithPercentages;

  const valueExcludingTopEight = holdingsWithPercentages
    .slice(8)
    .reduce((acc, coin) => {
      return acc + coin.totalValue;
    }, 0);

  return [
    ...holdingsWithPercentages.slice(0, 8),
    {
      id: "all-others",
      ticker: `${holdings.length - 8} other coins`,
      totalValue: valueExcludingTopEight,
      percentage: (valueExcludingTopEight / totalHoldingsValue) * 100,
      color: COLORS[8],
    },
  ];
}

type HoldingsBreakdownBarProps = {
  holdings: { id: string; ticker: string; totalValue: number }[];
};

export default function HoldingsBreakdownBar({
  holdings,
}: HoldingsBreakdownBarProps) {
  // ===== STATE VARIABLES =====
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // ===== DERIVED STATE =====
  const holdingsWithPercentages = convertHoldingsToPercentages(holdings);

  if (holdings.length === 0) return <CustomSkeleton className="h-10 w-full" />;

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex gap-0.5 mb-1">
        {holdingsWithPercentages.map((coin) => (
          <div
            key={coin.id}
            onMouseEnter={() => setHoveredId(coin.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              flexBasis: `${coin.percentage}%`,
              backgroundColor: coin.color,
              opacity:
                hoveredId === null ? 1 : hoveredId === coin.id ? 1 : 0.35,
              transform: hoveredId === coin.id ? "scaleY(1.15)" : "scaleY(1)",
            }}
            className="h-2 rounded-full cursor-pointer transition-all duration-200 ease-out"
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-2">
        {holdingsWithPercentages.map((coin) => (
          <div
            key={coin.id}
            onMouseEnter={() => setHoveredId(coin.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`cursor-pointer flex items-center gap-1 whitespace-nowrap transition-all duration-200 ease-out ${hoveredId === null ? "opacity-100" : hoveredId === coin.id ? "opacity-100" : "opacity-40"}`}
          >
            <div
              style={{ backgroundColor: coin.color }}
              className={`rounded-full size-2 transition-transform duration-200 ease-out ${hoveredId === coin.id ? "scale-125" : "scale-100"}`}
            />
            <p className="text-[10px] font-mono text-current pt-0.5">
              {coin.ticker.toUpperCase()} ({coin.percentage.toFixed(1)}%)
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
