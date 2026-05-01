import { useQuery } from "@tanstack/react-query";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CustomSkeleton from "@/components/CustomSkeleton";
import { numToMoney } from "@/utils";
import HoldingsBreakdownBar from "./HoldingsBreakdownBar";

async function getOpenTrades() {
  const response = await fetch("http://localhost:5000/get_open_trades", {
    method: "get",
    credentials: "include",
  });

  if (!response.ok) throw await response.json();

  return await response.json();
}

function filterOrdersByType(
  tradesData: any,
  orderType: string,
  transactionType: string,
) {
  return tradesData.filter(
    (order) =>
      order.order_type === orderType &&
      order.transaction_type === transactionType,
  );
}

function sumOrderValues(trades: any) {
  return trades.reduce(
    (acc: number, order) => acc + order.current_price * order.quantity,
    0,
  );
}

export default function OpenPositions() {
  // ===== REACT QUERY HOOKS =====
  const openTradesQuery = useQuery({
    queryKey: ["open-trades"],
    queryFn: getOpenTrades,
  });

  // ===== DERIVED STATE =====
  const reservedValue = openTradesQuery.data
    ? openTradesQuery.data.reduce(
        (acc: number, order) => acc + order.current_price * order.quantity,
        0,
      )
    : 0;

  const holdingsBreakdown = openTradesQuery.data
    ? [
        {
          id: "Limit Buy",
          ticker: "Limit Buy",
          totalValue: sumOrderValues(
            filterOrdersByType(openTradesQuery.data, "limit", "buy"),
          ),
        },
        {
          id: "Limit Sell",
          ticker: "Limit Sell",
          totalValue: sumOrderValues(
            filterOrdersByType(openTradesQuery.data, "limit", "sell"),
          ),
        },
        {
          id: "Stop Buy",
          ticker: "Stop Buy",
          totalValue: sumOrderValues(
            filterOrdersByType(openTradesQuery.data, "stop", "buy"),
          ),
        },
        {
          id: "Stop Sell",
          ticker: "Stop Sell",
          totalValue: sumOrderValues(
            filterOrdersByType(openTradesQuery.data, "stop", "sell"),
          ),
        },
      ].sort((a, b) => b.totalValue - a.totalValue)
    : [];

  return (
    <Card className="p-5 gap-0">
      <p className="text-xs text-gray-500 font-mono">RESERVED VALUE</p>
      {openTradesQuery.isLoading && <CustomSkeleton className="h-8 w-90" />}
      {openTradesQuery.data && (
        <h1 className="text-2xl font-bold mb-2">
          ${numToMoney(reservedValue)}
        </h1>
      )}
      <HoldingsBreakdownBar
        holdings={
          holdingsBreakdown.map((order) => {
            return {
              id: order.id,
              totalValue: order.totalValue,
              ticker: order.ticker,
            };
          }) ?? []
        }
      />
    </Card>
  );
}
