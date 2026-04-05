import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import TrendingCoinCard from "./TrendingCoinCard";
import NewTradeButton from "../NewTradeButton";

type TrendingCoinsProps = {
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
  }[];
  isLoading: boolean;
  isError: boolean;
};

const arr = Array.from({ length: 15 }, (_, i) => i);

export default function TrendingCoins({
  data,
  isLoading,
  isError,
}: TrendingCoinsProps) {
  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl">Trending Coins</h1>
      </div>
      <div className="relative px-10">
        <Carousel opts={{ dragFree: true }}>
          <CarouselContent>
            {arr.map((i) => {
              return (
                <CarouselItem className="basis-auto" key={i}>
                  <TrendingCoinCard
                    isLoading={isLoading}
                    isError={isError}
                    data={data?.at(i) || undefined}
                  />
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="cursor-pointer" />
          <CarouselNext className="cursor-pointer" />
        </Carousel>
      </div>
    </div>
  );
}
