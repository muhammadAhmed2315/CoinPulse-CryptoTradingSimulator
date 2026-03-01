import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

import PlaceholderIcon from "@/assets/icons/placeholder.svg";

type TrendingCoinCardProps = {
  img: string;
  name: string;
  ticker: string;
  delta: string;
  value: string;
};

export default function TrendingCoinCard({
  img,
  name,
  ticker,
  delta,
  value,
}: TrendingCoinCardProps) {
  return (
    <Card className="w-55 h-30 p-2 gap-2">
      <CardHeader className="flex items-center">
        <img src={PlaceholderIcon} />
        <img src={PlaceholderIcon} />
        <b>Bitcoin (BTC)</b>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <p className="text-2xl">3.19%</p>
        <img src={PlaceholderIcon} className="size-8" />
      </CardContent>
      <CardFooter>
        <p className="text-gray-600">$66,868.5456</p>
      </CardFooter>
    </Card>
  );
}
