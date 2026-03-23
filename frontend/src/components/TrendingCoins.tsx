import TrendingCoinCard from "./TrendingCoinCard";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";

const arr = Array.from({ length: 15 }, (_, i) => i);

export default function TrendingCoins() {
  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl">Trending Coins</h1>
        <RippleButton className="cursor-pointer text-xl">
          New Trade
          <RippleButtonRipples />
        </RippleButton>
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
