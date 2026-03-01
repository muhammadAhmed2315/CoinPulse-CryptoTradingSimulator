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

const placeholderProps: TrendingCoinCardProps = {
  img: "",
  name: "",
  ticker: "",
  delta: "",
  value: "",
};

const arr = Array.from({ length: 15 }, (_, i) => i);

export default function TrendingCoins() {
  return (
    <Carousel opts={{ dragFree: true }}>
      <CarouselContent>
        {arr.map((_) => {
          return (
            <CarouselItem className="basis-auto">
              <TrendingCoinCard {...placeholderProps} />
            </CarouselItem>
          );
        })}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
