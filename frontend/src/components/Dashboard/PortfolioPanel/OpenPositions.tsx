import { QueryClient, useQuery } from "@tanstack/react-query";

import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionPanel,
} from "@/components/animate-ui/components/base/accordion";
import CustomSkeleton from "@/components/CustomSkeleton";
import { numToMoney } from "@/utils";
import HoldingsBreakdownBar from "./HoldingsBreakdownBar";
import { Separator } from "@/components/ui/separator";
import OpenOrderRow from "./OpenOrderRow";
import { fetchWithRefresh } from "@/lib/api";

// ===== NAVBAR PREFETCH =====
export function prefetchOpenPositions(queryClient: QueryClient) {
  return Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["openTrades"],
      queryFn: getOpenTrades,
    }),
  ]);
}

// ===== API FUNCTIONS =====
async function getOpenTrades() {
  const response = await fetchWithRefresh("http://localhost:5000/get_open_trades", {
    method: "get",
    credentials: "include",
  });

  if (!response.ok) throw await response.json();

  return await response.json();
}

// ===== HELPER FUNCTIONS =====
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
    queryKey: ["openTrades"],
    queryFn: getOpenTrades,
  });

  // ===== DERIVED STATE =====
  const reservedValue = openTradesQuery.data
    ? openTradesQuery.data.reduce(
        (acc: number, order) => acc + order.current_price * order.quantity,
        0,
      )
    : 0;

  const openOrdersByType = openTradesQuery.data
    ? {
        "limit buy": filterOrdersByType(openTradesQuery.data, "limit", "buy"),
        "limit sell": filterOrdersByType(openTradesQuery.data, "limit", "sell"),
        "stop buy": filterOrdersByType(openTradesQuery.data, "stop", "buy"),
        "stop sell": filterOrdersByType(openTradesQuery.data, "stop", "sell"),
      }
    : {};

  const openOrdersSummary = openTradesQuery.data
    ? Object.keys(openOrdersByType).map((key) => ({
        id: key,
        ticker: key,
        totalValue: sumOrderValues(
          openOrdersByType[key as keyof typeof openOrdersByType],
        ),
        orderType: key.split(" ")[0],
        transactionType: key.split(" ")[1],
      }))
    : [];

  const openOrdersSummarySorted = openOrdersSummary.sort(
    (a, b) => b.totalValue - a.totalValue,
  );

  return (
    <Card className="gap-0 p-0">
      {/* ===== HEADER ===== */}
      <div className="p-5 pb-0">
        {/* ===== RESERVED VALUE ===== */}
        <p className="text-xs text-gray-500 font-mono">RESERVED VALUE</p>
        {openTradesQuery.isLoading && <CustomSkeleton className="h-8 w-90" />}
        {openTradesQuery.data && (
          <h1 className="text-2xl font-bold mb-2">
            ${numToMoney(reservedValue)}
          </h1>
        )}

        {/* ===== BREAKDOWN BAR ===== */}
        {openOrdersSummarySorted.reduce(
          (acc, order) => acc + order.totalValue,
          0,
        ) !== 0 && (
          <div className="pb-2">
            <HoldingsBreakdownBar
              holdings={openOrdersSummarySorted.map((order) => {
                return {
                  id: order.id,
                  totalValue: order.totalValue,
                  ticker: order.ticker,
                };
              })}
            />
          </div>
        )}
      </div>

      <Separator />

      <div className="p-5 pt-0">
        <Accordion>
          {openOrdersSummary.map((orders) => {
            return (
              <AccordionItem key={orders.id} value={orders.id}>
                {/* ===== TRIGGER ===== */}
                <AccordionTrigger className="hover:no-underline cursor-pointer">
                  <div className="flex justify-between w-full">
                    <span className="cursor-pointer font-bold text-[15px] capitalize">
                      {orders.id} Orders
                    </span>
                    <span className="font-mono text-[13px] text-[#71717a] pt-0.5">
                      {openOrdersByType[orders.id].length} ORDERS
                    </span>
                  </div>
                </AccordionTrigger>

                {/* ===== CONTENT ===== */}
                <AccordionPanel className="flex-col">
                  {/* ===== ORDERS EXIST ===== */}
                  {openOrdersByType[orders.id].length > 0 &&
                    openOrdersByType[orders.id].map((order) => (
                      <OpenOrderRow
                        order={order}
                        refetch={openTradesQuery.refetch}
                      />
                    ))}

                  {/* ===== NO ORDERS ===== */}
                  {openOrdersByType[orders.id].length === 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-[#f7f7f8] rounded-lg mb-1.5">
                      <p className="font-mono text-base text-[#a0a0a0] w-7 h-7 flex items-center justify-center bg-white border border-[#ececef] rounded-full shrink-0">
                        0
                      </p>

                      <div className="flex flex-col gap-0 min-w-0">
                        <p className="text-base font-semibold text-[#3f3f46]">
                          No {orders.id} orders placed
                        </p>
                        <p className="text-sm text-[#71717a]">
                          {orders.id === "limit buy"
                            ? "No bids waiting below market."
                            : orders.id === "limit sell"
                              ? "No asks waiting above market."
                              : orders.id === "stop buy"
                                ? "Nothing waiting above market right now."
                                : "Nothing waiting below market right now."}
                        </p>
                      </div>
                    </div>
                  )}
                </AccordionPanel>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </Card>
  );
}
