import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "./ui/button";

import DotGreen from "@/assets/dot-green.svg";
import DotAmber from "@/assets/dot-amber.svg";
import DotRed from "@/assets/dot-red.svg";

export default function TradesTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <p className="text-2xl">My Trades</p>
        </CardTitle>
        <CardDescription className="flex items-baseline gap-1">
          <p className="text-3xl  text-black">17</p>
          <p>records</p>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CardAction className="flex gap-1.5">
          <Button variant="secondary" className="cursor-pointer">
            All
          </Button>
          <Button variant="secondary" className="cursor-pointer">
            <img src={DotGreen} />
            Active
          </Button>
          <Button variant="secondary" className="cursor-pointer">
            <img src={DotAmber} />
            Finished
          </Button>
          <Button variant="secondary" className="cursor-pointer">
            <img src={DotRed} />
            Cancelled
          </Button>
        </CardAction>
        <p>Card Content</p>
      </CardContent>
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
  );
}
