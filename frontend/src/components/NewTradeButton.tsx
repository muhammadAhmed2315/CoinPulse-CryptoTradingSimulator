import {
  RippleButton,
  RippleButtonRipples,
} from "./animate-ui/components/buttons/ripple";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import NewTradeCard from "./NewTradeCard";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

type NewTradeButtonProps = {
  prefetchFn: () => Promise<void>;
};

export default function NewTradeButton({ prefetchFn }: NewTradeButtonProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <RippleButton
          className="cursor-pointer text-xl bg-emerald-500 hover:bg-emerald-600 border-0"
          onMouseEnter={prefetchFn}
        >
          New Trade
          <RippleButtonRipples />
        </RippleButton>
      </DialogTrigger>
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
