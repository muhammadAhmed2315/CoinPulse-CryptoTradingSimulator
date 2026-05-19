import CrossIcon from "@/assets/icons/cross.svg";
import {
  useMutation,
  type QueryObserverResult,
  type RefetchOptions,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";

// ===== TYPES =====
type CancelOrderBtnProps = {
  transaction_id: string;
  refetch: (
    options?: RefetchOptions,
  ) => Promise<QueryObserverResult<unknown, Error>>;
};

// ===== API FUNCTIONS =====
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

export default function CancelOrderBtn({
  transaction_id,
  refetch,
}: CancelOrderBtnProps) {
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
    <>
      {successTimer > 0 ? (
        /* ===== SUCCESS STATE ===== */
        <span className="bg-[#10b981] font-semibold pt-1 px-2 text-[11px] rounded-[6px] text-white">
          Cancelled!
        </span>
      ) : errorTimer > 0 ? (
        /* ===== ERROR STATE ===== */
        <span className="bg-[#f43f5e] font-semibold pt-1 px-2 text-[11px] rounded-[6px] text-white">
          Error!
        </span>
      ) : (
        /* ===== CANCEL BUTTON ===== */
        <div
          className="cursor-pointer size-5.5 border flex items-center justify-center border-[#ececef] rounded-[6px] hover:border-[#71717a]"
          onClick={() => cancelOpenTradeMutation.mutate(transaction_id)}
        >
          <img className="size-4 " src={CrossIcon} />
        </div>
      )}
    </>
  );
}
