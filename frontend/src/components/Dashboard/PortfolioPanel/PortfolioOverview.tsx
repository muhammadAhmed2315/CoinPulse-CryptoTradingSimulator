import PlaceholderIcon from "@/assets/icons/placeholder.svg";
import { Card } from "@/components/ui/card";

async function fetchTotalPortfolioValue() {
  const response = await fetch(
    "http://localhost:5000/get_wallet_total_current_value",
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) throw await response.json();

  return await response.json();
}

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
