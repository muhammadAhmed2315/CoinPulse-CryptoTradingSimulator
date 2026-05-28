import {
  RippleButton,
  RippleButtonRipples,
} from "../animate-ui/components/buttons/ripple";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import NewTradeCard, { prefetchNewTradeCard } from "./NewTradeCard";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { useQueryClient } from "@tanstack/react-query";

// ===== TYPES =====
type NewTradeButtonProps = {
  initialCoin?: {
    name: string;
    ticker: string;
    id: string;
  };
};

/**
 * Component showing a "New Trade" button, opens a "New Trade" card when clicked.
 */
export default function NewTradeButton({ initialCoin }: NewTradeButtonProps) {
  const queryClient = useQueryClient();

  return (
    <Dialog>
      {/* ===== TRIGGER BUTTON ===== */}
      <DialogTrigger asChild>
        <RippleButton
          className="cursor-pointer font-mono text-[13px] font-semibold uppercase tracking-[0.06em] bg-primary hover:bg-primary/90 text-primary-foreground border-0 px-5 py-3 rounded-md"
          onFocus={() => {
            prefetchNewTradeCard(queryClient, initialCoin);
          }}
          onMouseEnter={() => {
            prefetchNewTradeCard(queryClient, initialCoin);
          }}
        >
          {initialCoin
            ? `Trade ${initialCoin.ticker.toUpperCase()}`
            : "NEW TRADE"}
          <RippleButtonRipples />
        </RippleButton>
      </DialogTrigger>

      {/* ===== DIALOG CONTENT ===== */}
      <DialogContent
        className="min-w-200 flex border-0 p-0"
        aria-describedby={undefined}
      >
        <VisuallyHidden.Root>
          <DialogHeader>
            <DialogTitle>Place Order</DialogTitle>
          </DialogHeader>
        </VisuallyHidden.Root>
        <NewTradeCard initialCoin={initialCoin} />
      </DialogContent>
    </Dialog>
  );
}
