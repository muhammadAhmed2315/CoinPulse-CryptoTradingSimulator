import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "./ui/separator";

export default function PortfolioAnalytics() {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>
            <p className="text-2xl">Portfolio Analytics</p>
          </CardTitle>
          <CardDescription>
            <Tabs defaultValue="total-value">
              <TabsList>
                <TabsTrigger
                  value="total-value"
                  className="text-base cursor-pointer"
                >
                  Total Value
                </TabsTrigger>
                <TabsTrigger
                  value="assets"
                  className="text-base cursor-pointer"
                >
                  Assets
                </TabsTrigger>
                <TabsTrigger
                  value="balance"
                  className="text-base cursor-pointer"
                >
                  Balance
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardDescription>
          <CardAction>
            <RippleButton className="text-xl cursor-pointer" variant="default">
              New Trade
              <RippleButtonRipples />
            </RippleButton>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p>Graph goes here</p>
        </CardContent>
        <CardFooter className="flex flex-col">
          <Separator className="bg-[#f0f0f0] mb-4" />
          <div className="flex w-full h-16">
            <div className="flex-1 flex flex-col items-start pl-4">
              <p className="text-[#bbb]">High</p>
              <b>$1,350,000</b>
            </div>

            <Separator orientation="vertical" className="bg-[#f0f0f0]" />

            <div className="flex-1 flex flex-col items-start pl-4">
              <p className="text-[#bbb]">Low</p>
              <b>$992,015</b>
            </div>

            <Separator orientation="vertical" className="bg-[#f0f0f0]" />

            <div className="flex-1 flex flex-col items-start pl-4">
              <p className="text-[#bbb]">Open</p>
              <b>$992,015</b>
            </div>

            <Separator orientation="vertical" className="bg-[#f0f0f0]" />

            <div className="flex-1 flex flex-col items-start pl-4">
              <p className="text-[#bbb]">Close</p>
              <b>$1,332,487</b>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

// NEW GRAPH SETTINGS:
// Line: #111
// Fill top: rgba(0,0,0,0.12)
// Fill bottom: rgba(0,0,0,0.01)
// Black background hover boxes with white text
// #999999 for the 1m 3m 6m ytd 1y all labels
