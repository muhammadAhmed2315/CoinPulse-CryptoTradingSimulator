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
      {/* ===== "New Trade" Button ===== */}
      <DialogTrigger asChild>
        <RippleButton
          className="cursor-pointer text-xl bg-emerald-500 hover:bg-emerald-600 border-0"
          onMouseEnter={prefetchFn}
        >
          New Trade
          <RippleButtonRipples />
        </RippleButton>
      </DialogTrigger>

      {/* ===== Content to show when button is clicked ===== */}
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
