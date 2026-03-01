import TrendingCoinCard, {
  type TrendingCoinCardProps,
} from "./TrendingCoinCard";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "./ui/button";

const arr = Array.from({ length: 15 }, (_, i) => i);

export default function TrendingCoins() {
  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl">Trending Coins</h1>
        <Button variant="default" className="cursor-pointer text-xl">
          New Trade
        </Button>
      </div>
      <div className="relative px-10">
        <Carousel opts={{ dragFree: true }}>
          <CarouselContent>
            {arr.map((i) => {
              return (
                <CarouselItem className="basis-auto" key={i}>
                  <TrendingCoinCard />
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
