import { numToMoney } from "@/utils";
import PercentageChangeBar from "./PercentageChangeBar";

type CurrencyBenchmarkListProps = {
  btc: number;
  usd: number;
};

export default function CurrencyBenchmarkList({
  btc,
  usd,
}: CurrencyBenchmarkListProps) {
  const max = Math.max(Math.abs(btc), Math.abs(usd));

  const btcNorm = (btc / max) * 50;
  const usdNorm = (usd / max) * 50;

  return (
    <div className="px-2">
      <p className="text-xs text-center text-gray-500">
        24H VS OTHER CURRENCIES
      </p>
      <div className="flex gap-2 items-center">
        <p>BTC</p>
        <PercentageChangeBar change={btcNorm} />
        <p
          className={
            btc > 0
              ? "text-[#21c45d]"
              : btc < 0
                ? "text-[#ef4444]"
                : "text-black"
          }
        >
          {btc > 0 ? "+" : ""}
          {numToMoney(btc)}%
        </p>
      </div>

      <div className="flex gap-2 items-center">
        <p>USD</p>
        <PercentageChangeBar change={usdNorm} />
        <p
          className={
            usd > 0
              ? "text-[#21c45d]"
              : usd < 0
                ? "text-[#ef4444]"
                : "text-black"
          }
        >
          {usd > 0 ? "+" : ""}
          {numToMoney(usd)}%
        </p>
      </div>
    </div>
  );
}
