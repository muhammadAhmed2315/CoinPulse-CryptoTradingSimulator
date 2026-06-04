import { numToMoney } from "@/utils";

// ===== TYPES =====
type PriceChangeBoxProps = {
  priceChange: number;
  fontSize?: string;
};

// ===== COMPONENT =====
export default function PriceChangeBox({
  priceChange,
  fontSize = "md",
}: PriceChangeBoxProps) {
  return (
    <div
      className={`flex gap-1 rounded-md px-2 py-0.5 whitespace-nowrap ${priceChange! > 0 ? "bg-green-50 dark:bg-emerald-500/15" : priceChange! < 0 ? "bg-red-50 dark:bg-rose-500/15" : "bg-black/5 dark:bg-white/10"}`}
    >
      {/* ===== PRICE CHANGE VALUE ===== */}
      <p
        className={`${priceChange! > 0 ? "text-[#21c45d] dark:text-emerald-400" : priceChange! < 0 ? "text-[#ef4444] dark:text-rose-400" : "text-black/60 dark:text-white/60"} text-${fontSize} font-bold`}
      >
        {priceChange! > 0 ? "↑" : priceChange! < 0 ? "↓ " : ""}{" "}
        {numToMoney(priceChange!, true)}%
      </p>
      {/* ===== TIMEFRAME LABEL ===== */}
      <p
        className={`${priceChange! > 0 ? "text-[#21c45d] dark:text-emerald-400" : priceChange! < 0 ? "text-[#ef4444] dark:text-rose-400" : "text-black/60 dark:text-white/60"} text-${fontSize}`}
      >
        24h
      </p>
    </div>
  );
}
