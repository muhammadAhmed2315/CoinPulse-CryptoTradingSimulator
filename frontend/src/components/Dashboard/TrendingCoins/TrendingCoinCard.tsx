import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

import formatCompactValue, { numToMoney } from "@/utils";
import ErrorFallback from "@/components/ErrorFallback";
import CurrencyBenchmarkList from "./CurrencyBenchmarkList";
import { BorderBeam } from "@/components/ui/border-beam";
import CustomSkeleton from "@/components/CustomSkeleton";
import CustomTooltip from "@/components/CustomTooltip";
import PriceChangeBox from "@/components/PriceChangeBox";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { prefetchCoinInfo } from "@/pages/CoinInfo";
import { useQueryClient } from "@tanstack/react-query";

// ===== TYPES =====
type TrendingCoinCardProps = {
  data?: {
    coin_id: string;
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
  // ===== STATE VARIABLES =====
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  // ===== DERIVED STATE =====
  const priceChange = data ? data.price_change_percentage_24h.usd : undefined;
  const borderBeamColor = isError ? "#ff0000" : "#444";

  // ===== REACT QUERY HOOKS =====
  const queryClient = useQueryClient();

  return (
    <Card
      className={`relative p-3 gap-0 w-60 min-h-60.5 overflow-hidden ${
        isError ? "cursor-default" : "cursor-pointer"
      }`}
      onFocus={() => {
        if (data) prefetchCoinInfo(queryClient, { id: data.coin_id, name: data.name });
      }}
      onMouseEnter={() => {
        setHovered(true);
        if (data) prefetchCoinInfo(queryClient, { id: data.coin_id, name: data.name });
      }}
      onMouseLeave={() => setHovered(false)}
      onClick={
        isError
          ? undefined
          : () =>
              navigate(`/coin_info`, {
                state: {
                  coin: {
                    id: data?.coin_id,
                    name: data?.name,
                    ticker: data?.symbol,
                    imgUrl: data?.thumb,
                  },
                },
              })
      }
    >
      {/* ===== BORDER BEAM ===== */}
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
        /* ===== LOADING STATE ===== */
        <>
          {/* ===== HEADER ===== */}
          <CardHeader className="flex px-2 justify-between items-center mb-3">
            <div className="flex items-center">
              <CustomSkeleton className="size-8 rounded-full mr-2.5" />
              <CustomSkeleton className="h-4 w-24" />
            </div>
            <CustomSkeleton className="h-4 w-8 rounded-md" />
          </CardHeader>

          {/* ===== BODY ===== */}
          <CardContent className="px-2">
            <CustomSkeleton className="h-3 w-10 mb-2" />
            <div className="flex justify-between items-center gap-2 mb-3">
              <CustomSkeleton className="h-6 w-28" />
              <CustomSkeleton className="h-5 w-14 rounded-md" />
            </div>
            <CustomSkeleton className="h-16 w-full rounded-md" />
          </CardContent>

          <Separator className="mt-3 mb-3" />

          {/* ===== FOOTER ===== */}
          <CardFooter className="h-8 px-2">
            <div className="flex-2">
              <CustomSkeleton className="h-4 w-16" />
            </div>
            <Separator orientation="vertical" className="mr-3" />
            <div className="flex-2">
              <CustomSkeleton className="h-4 w-16" />
            </div>
          </CardFooter>
        </>
      ) : isError ? (
        /* ===== ERROR STATE ===== */
        <ErrorFallback
          size="md"
          title="Data unavailable"
          description="Coin data could not be loaded."
          className="flex-1"
        />
      ) : (
        <>
          {/* ===== HEADER ===== */}
          <CardHeader className="flex px-2 justify-between items-center mb-3">
            <div>
              <div className="flex items-center">
                <img src={data!.thumb} className="size-8 rounded-full mr-2.5" />
                <div className="flex flex-col gap-1">
                  <CustomTooltip
                    trigger={`${data!.name.slice(0, 10)}${data!.name.length > 10 ? "..." : ""}`}
                    content={`${data!.name} (${data!.symbol})`}
                    triggerStyle="text-sm font-bold tracking-[-0.01em] leading-none"
                  />
                  <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground font-medium leading-none">
                    {data!.symbol}
                  </p>
                </div>
              </div>
            </div>

            {/* TODO: Change the copy? */}
            <CustomTooltip
              trigger={`#${data!.market_cap_rank}`}
              content={`Market Cap Rank: #${data!.market_cap_rank}`}
              triggerStyle="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground bg-muted border border-border px-1.5 py-[3px] rounded-md"
            />
          </CardHeader>

          {/* ===== BODY ===== */}
          <CardContent className="px-2">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground leading-none mb-1.5">
              Price
            </p>

            <div className="flex justify-between items-center gap-2 mb-3">
              <b className="font-mono text-[20px] font-semibold tracking-[-0.02em] leading-none min-w-0 truncate">
                ${numToMoney(data!.price)}
              </b>
              <div className="shrink-0">
                <PriceChangeBox priceChange={priceChange!} fontSize="sm" />
              </div>
            </div>

            <CurrencyBenchmarkList
              btc={data!.price_change_percentage_24h.btc}
              usd={data!.price_change_percentage_24h.usd}
            />
          </CardContent>

          <Separator className="mt-3 mb-3" />

          {/* ===== FOOTER ===== */}
          <CardFooter className="h-8 px-2">
            <div className="flex-2 flex flex-col gap-1">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground leading-none">
                Mkt Cap
              </p>
              <b className="font-mono text-sm tracking-[-0.01em] leading-none">
                ${formatCompactValue(data!.market_cap ?? 0)}
              </b>
            </div>
            <Separator orientation="vertical" className="mr-3" />
            <div className="flex-2 flex flex-col gap-1">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground leading-none">
                Volume
              </p>
              <b className="font-mono text-sm tracking-[-0.01em] leading-none">
                ${formatCompactValue(data!.total_volume ?? 0)}
              </b>
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
