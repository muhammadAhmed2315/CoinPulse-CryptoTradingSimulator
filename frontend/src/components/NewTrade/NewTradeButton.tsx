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
import NewTradeCard from "./NewTradeCard";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

// ===== TYPES =====
type NewTradeButtonProps = {
  /** Used to prefetch a list of all the coins in the format Coin[]  */
  prefetchFn: () => Promise<void>;
};

/**
 * Component showing a "New Trade" button, opens a "New Trade" card when clicked.
 */
export default function NewTradeButton({ prefetchFn }: NewTradeButtonProps) {
  return (
    <Dialog>
      {/* ===== TRIGGER BUTTON ===== */}
      <DialogTrigger asChild>
        <RippleButton
          className="cursor-pointer font-mono text-[13px] font-semibold uppercase tracking-[0.06em] bg-zinc-900 hover:bg-zinc-800 text-white border-0 px-5 py-3 rounded-md"
          onMouseEnter={prefetchFn}
        >
          New Trade
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
        <NewTradeCard />
      </DialogContent>
    </Dialog>
  );
}
