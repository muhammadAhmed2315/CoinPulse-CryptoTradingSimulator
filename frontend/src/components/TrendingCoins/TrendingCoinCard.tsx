import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

import { numToMoney } from "@/utils";
import RedWarningIcon from "@/assets/icons/warning-red.svg";
import { BorderBeam } from "../ui/border-beam";
import { Spinner } from "../ui/spinner";
import CustomTooltip from "../CustomTooltip";
import { Separator } from "../ui/separator";
import CurrencyBenchmarkList from "./CurrencyBenchmarkList";

function formatCompactValue(num: number) {
  if (num >= 1_000_000_000_000) {
    return `${(num / 1_000_000_000_000).toPrecision(3)}T`;
  } else if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toPrecision(3)}B`;
  } else if (num >= 1_000_000) {
    return `${(num / 1_000_000).toPrecision(3)}M`;
  } else if (num >= 1_000) {
    return `${(num / 1_000).toPrecision(3)}K`;
  }

  return `${num}`;
}

type TrendingCoinCardProps = {
  data?: {
    name: string;
    thumb: string;
    symbol: string;
    market_cap_rank: number;
    price: number;
    market_cap: number;
    total_volume: number;
    price_change_percentage_24h: {
      btc: number;
      usd: number;
    };
  };
  isLoading: boolean;
  isError: boolean;
};

export default function TrendingCoinCard({
  data,
  isLoading,
  isError,
}: TrendingCoinCardProps) {
  const [hovered, setHovered] = useState(false);
  const priceChange = data ? data.price_change_percentage_24h.usd : undefined;
  const borderBeamColor = isError ? "#ff0000" : "#444";

  return (
    <Card
      className="relative cursor-pointer p-3 gap-0 w-60 overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <>
          <BorderBeam
            duration={4}
            size={200}
            borderWidth={2}
            colorFrom={borderBeamColor}
            colorTo="#ffffff"
          />
          <BorderBeam
            duration={4}
            size={200}
            borderWidth={2}
            colorFrom={borderBeamColor}
            colorTo="#ffffff"
            initialOffset={50}
          />
        </>
      )}
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <Spinner className="size-8" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-5 px-3 gap-2.5 text-center">
          <img src={RedWarningIcon} />
          <div>
            <p className="text-sm font-medium text-gray-800 mb-1">
              Data unavailable
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Coin data could not be loaded.
            </p>
          </div>
        </div>
      ) : (
        <>
          <CardHeader className="flex px-2 justify-between mb-2">
            <div>
              <div className="flex">
                <img src={data!.thumb} className="size-8 rounded-full mr-2" />
                <div className="flex flex-col">
                  <CustomTooltip
                    trigger={`${data!.name.slice(0, 10)}...`}
                    content={`${data!.name} (${data!.symbol})`}
                    triggerStyle="text-sm font-semibold"
                  />
                  <p className="text-xs">{data!.symbol}</p>
                </div>
              </div>
            </div>

            {/* TODO: Change the copy? */}
            <CustomTooltip
              trigger={`#${data!.market_cap_rank}`}
              content={`Market Cap Rank: #${data!.market_cap_rank}`}
            />
          </CardHeader>

          <CardContent className="px-2">
            <p className="text-gray-500">PRICE</p>

            <div className="flex justify-between items-center mb-3">
              <b className="text-lg">${numToMoney(data!.price)}</b>
              <div
                className={`rounded-md px-2 py-0.5 ${priceChange! > 0 ? "bg-green-50" : priceChange! < 0 ? "bg-red-50" : "bg-black/5"}`}
              >
                <p
                  className={
                    priceChange! >= 0 ? "text-[#21c45d]" : "text-[#ef4444]"
                  }
                >
                  {priceChange! > 0 ? "↑" : priceChange! < 0 ? "↓ " : ""}{" "}
                  {numToMoney(priceChange!, true)}%
                </p>
              </div>
            </div>

            <CurrencyBenchmarkList
              btc={data!.price_change_percentage_24h.btc}
              usd={data!.price_change_percentage_24h.usd}
            />
          </CardContent>

          <Separator className="mt-2 mb-3" />

          <CardFooter className="h-8">
            <div className="flex-2">
              <p className="text-xs text-gray-500">MKT CAP</p>
              <b>${formatCompactValue(data!.market_cap ?? 0)}</b>
            </div>
            <Separator orientation="vertical" className="mr-3" />
            <div className="flex-2">
              <p className="text-xs text-gray-500">VOLUME</p>
              <b>${formatCompactValue(data!.total_volume ?? 0)}</b>
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
