import CancelOrderBtn from "@/components/CancelOrderBtn";
import { numToMoney } from "@/utils";
import type {
  RefetchOptions,
  QueryObserverResult,
} from "@tanstack/react-query";

// ===== TYPES =====
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
            <CancelOrderBtn transaction_id={order.id} refetch={refetch} />
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
