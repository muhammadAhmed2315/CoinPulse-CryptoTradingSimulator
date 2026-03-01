import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "./ui/separator";
import PlaceholderIcon from "@/assets/icons/placeholder.svg";
import HeartIcon from "@/assets/icons/heart.svg";
import { Button } from "./ui/button";

type FeedPostProps = {
  img: string;
  username: string;
  timestamp: string;
  description: string;
  likes: number;
  coinName: string;
  quantity: number;
  orderType: string;
  price: number;
};

export default function FeedPost() {
  return (
    <Card className="p-6">
      <CardHeader className="p-0">
        <div className="flex gap-4 items-center">
          <img src={PlaceholderIcon} className="size-15" />
          <div>
            <b>muhahmed3758</b>
            <p>1762204236</p>
          </div>
        </div>
        <CardAction className="flex flex-col items-end">
          <p className="text-xl">+237276.0707 Ethereumx</p>
          <p className="text-lg">Buy @ $0</p>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        <p className="text-lg">This trade has no description.</p>
      </CardContent>
      <Separator />
      <CardFooter className="p-0 flex justify-between">
        <p>Just now</p>
        <Button variant="outline" className="cursor-pointer">
          <img src={HeartIcon} />0 likes
        </Button>
      </CardFooter>
    </Card>
  );
}
