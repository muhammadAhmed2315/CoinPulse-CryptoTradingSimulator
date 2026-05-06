import { numToMoney } from "@/utils";
import CrossIcon from "@/assets/icons/cross.svg";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type {
  RefetchOptions,
  QueryObserverResult,
} from "@tanstack/react-query";

async function cancelOpenOrder(transaction_id: string) {
  const response = await fetch("http://localhost:5000/cancel_open_trade", {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction_id: transaction_id }),
    credentials: "include",
  });

  if (!response.ok) throw await response.json();

  return await response.json();
}

type OpenOrderRowProps = {
  order: {
    image: string;
    transaction_type: "buy" | "sell";
    current_price: number;
    price_per_unit: number;
    name: string;
    order_type: "limit" | "stop";
    quantity: number;
    ticker: string;
    id: string;
  };
  refetch: (
    options?: RefetchOptions,
  ) => Promise<QueryObserverResult<unknown, Error>>;
};

export default function OpenOrderRow({ order, refetch }: OpenOrderRowProps) {
  // ===== STATE =====
  const [successTimer, setSuccessTimer] = useState(-1);
  const [errorTimer, setErrorTimer] = useState(-1);

  // ===== REACT QUERY HOOKS =====
  const cancelOpenTradeMutation = useMutation({
    mutationFn: (transaction_id: string) => cancelOpenOrder(transaction_id),
    onSuccess: () => setSuccessTimer(3),
    onError: () => setErrorTimer(3),
  });

  // ===== USEEFFECT HOOKS =====
  useEffect(() => {
    if (successTimer === 0) {
      refetch();
      return;
    }
    const id = setTimeout(() => setSuccessTimer((s) => s - 1), 1_000);
    return () => clearTimeout(id);
  }, [refetch, successTimer]);

  useEffect(() => {
    if (errorTimer === 0) return;
    const id = setTimeout(() => setErrorTimer((s) => s - 1), 1_000);
    return () => clearTimeout(id);
  }, [errorTimer]);

  return (
    <div className="flex w-full items-center font-mono gap-3 mb-3 py-2 border-y">
      <img src={order.image} className="size-8" />
      <div className="flex-col w-full">
        <div className="flex justify-between">
          <div className="flex gap-2">
            <p className="text-[14px] font-semibold">{order.name}</p>
          </div>

          <div className="flex gap-4">
            <div className="flex gap-1">
              <span className="text-[14px] font-semibold">
                $
                {numToMoney(
                  Math.abs(order.current_price - order.price_per_unit),
                )}
              </span>
              <span className="font-mono text-[#71717a]">away</span>
            </div>
            {successTimer > 0 ? (
              <span className="bg-[#10b981] font-semibold pt-1 px-2 text-[11px] rounded-[6px] text-white">
                Cancelled!
              </span>
            ) : errorTimer > 0 ? (
              <span className="bg-[#f43f5e] font-semibold pt-1 px-2 text-[11px] rounded-[6px] text-white">
                Error!
              </span>
            ) : (
              <div
                className="cursor-pointer size-5.5 border flex items-center justify-center border-[#ececef] rounded-[6px] hover:border-[#71717a]"
                onClick={() => cancelOpenTradeMutation.mutate(order.id)}
              >
                <img className="size-4 " src={CrossIcon} />
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-between">
          <div className="flex items-center gap-1.5">
            <span className="uppercase pt-1 text-[12px] text-[#6b7280]">
              {order.order_type}
            </span>
            <span className="text-[14px] font-semibold">
              ${numToMoney(order.price_per_unit)}
            </span>
            <span className="pb-1">→</span>
            <span className="pt-1 text-[12px] text-[#6b7280]">NOW</span>
            <span className="text-[14px] font-semibold">
              ${numToMoney(order.current_price)}
            </span>
          </div>

          <div className="pt-0.5">
            <span className="uppercase font-mono text-[12px] text-[#71717a]">
              {numToMoney(order.quantity.toFixed(4))} {order.ticker}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
