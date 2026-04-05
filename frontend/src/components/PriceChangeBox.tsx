import { numToMoney } from "@/utils";

type PriceChangeBoxProps = {
  priceChange: number;
  fontSize?: string;
};

export default function PriceChangeBox({
  priceChange,
  fontSize = "md",
}: PriceChangeBoxProps) {
  return (
    <div
      className={`flex gap-1 rounded-md px-2 py-0.5 ${priceChange! > 0 ? "bg-green-50" : priceChange! < 0 ? "bg-red-50" : "bg-black/5"}`}
    >
      <p
        className={`${priceChange! >= 0 ? "text-[#21c45d]" : "text-[#ef4444]"} text-${fontSize} font-bold`}
      >
        {priceChange! > 0 ? "↑" : priceChange! < 0 ? "↓ " : ""}{" "}
        {numToMoney(priceChange!, true)}%
      </p>
      <p
        className={`${priceChange! >= 0 ? "text-[#21c45d]" : "text-[#ef4444]"} text-${fontSize}`}
      >
        24h
      </p>
    </div>
  );
}
