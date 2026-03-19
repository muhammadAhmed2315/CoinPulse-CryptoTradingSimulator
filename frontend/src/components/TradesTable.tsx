import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";

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
          <RippleButton variant="secondary" className="cursor-pointer">
            All
            <RippleButtonRipples />
          </RippleButton>
          <RippleButton variant="secondary" className="cursor-pointer">
            <img src={DotGreen} />
            Active
            <RippleButtonRipples />
          </RippleButton>
          <RippleButton variant="secondary" className="cursor-pointer">
            <img src={DotAmber} />
            Finished
            <RippleButtonRipples />
          </RippleButton>
          <RippleButton variant="secondary" className="cursor-pointer">
            <img src={DotRed} />
            Cancelled
            <RippleButtonRipples />
          </RippleButton>
        </CardAction>
        <p>Card Content</p>
      </CardContent>
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
  );
}
