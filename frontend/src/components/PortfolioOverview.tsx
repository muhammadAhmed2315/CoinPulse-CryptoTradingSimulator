import PlaceholderIcon from "@/assets/icons/placeholder.svg";
import { Card } from "./ui/card";

const arr = Array.from({ length: 10 }, (_, i) => i);

export default function PortfolioOverview() {
  return (
    <Card className="gap-2">
      <div className="flex justify-around">
        <p className="text-lg">Holdings</p>
        <p className="text-lg">Amount</p>
      </div>
      {arr.map((i) => {
        return (
          <div className="flex justify-around" key={i}>
            <div className="flex gap-2">
              <img src={PlaceholderIcon} className="size-6" />
              <p>Bitcoin</p>
            </div>
            <p>$1,081,224.56</p>
          </div>
        );
      })}
    </Card>
  );
}
