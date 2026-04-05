import {
  RippleButton,
  RippleButtonRipples,
} from "./animate-ui/components/buttons/ripple";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import NewTradeCard from "./NewTradeCard";

export default function NewTradeButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <RippleButton className="cursor-pointer text-xl bg-emerald-500 hover:bg-emerald-600 border-0">
          New Trade
          <RippleButtonRipples />
        </RippleButton>
      </DialogTrigger>
      <DialogContent className="min-w-200 flex border-0 p-0">
        <NewTradeCard />
      </DialogContent>
    </Dialog>
  );
}
