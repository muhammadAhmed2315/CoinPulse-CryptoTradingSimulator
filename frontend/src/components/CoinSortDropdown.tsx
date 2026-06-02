import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ApiSorts } from "@/pages/TopCoins";

import UpArrowIcon from "@/assets/icons/arrow-up.svg";
import DownArrowIcon from "@/assets/icons/arrow-down.svg";

// ===== TYPES =====
type CoinSortDropdownProps = {
  sortBy: ApiSorts;
  setSortBy: React.Dispatch<React.SetStateAction<ApiSorts>>;
};

// ===== CONSTANTS =====
const sortByMap: Record<ApiSorts, string> = {
  market_cap_asc: "Market Cap Ascending",
  market_cap_desc: "Market Cap Descending",
  volume_asc: "Volume Ascending",
  volume_desc: "Volume Descending",
};

export default function CoinSortDropDown({
  sortBy,
  setSortBy,
}: CoinSortDropdownProps) {
  // ===== EVENT HANDLERS =====
  function handleCapAscClick() {
    setSortBy("market_cap_asc");
  }

  function handleCapDescClick() {
    setSortBy("market_cap_desc");
  }

  function handleVolAscClick() {
    setSortBy("volume_asc");
  }

  function handleVolDescClick() {
    setSortBy("volume_desc");
  }

  return (
    <DropdownMenu>
      {/* ===== TRIGGER BUTTON ===== */}
      <DropdownMenuTrigger asChild>
        <RippleButton
          variant="outline"
          className="cursor-pointer inline-flex! items-center! justify-start! gap-2.5! min-w-55 px-3.5! py-2.25! text-[13px]! font-medium! text-foreground! bg-background! border! border-border! rounded-lg! shadow-none! hover:border-[#71717a]!"
        >
          <img
            src={
              sortBy === "market_cap_asc" || sortBy == "volume_asc"
                ? UpArrowIcon
                : DownArrowIcon
            }
            className="size-3 opacity-55"
          />
          {sortByMap[sortBy]}
          <RippleButtonRipples />
        </RippleButton>
      </DropdownMenuTrigger>
      {/* ===== DROPDOWN MENU ===== */}
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="min-w-60 p-1.5 rounded-[10px] border border-border bg-background shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
      >
        {/* ===== MARKET CAP GROUP ===== */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground px-2.5 py-1">
            Market Cap
          </DropdownMenuLabel>
          <DropdownMenuItem
            className={`cursor-pointer px-2.5 py-2 text-[13px] text-foreground rounded-md focus:bg-muted ${sortBy === "market_cap_asc" ? "bg-accent font-semibold" : ""}`}
            onClick={handleCapAscClick}
          >
            <img src={UpArrowIcon} className="size-4 opacity-70" />
            Ascending
          </DropdownMenuItem>
          <DropdownMenuItem
            className={`cursor-pointer px-2.5 py-2 text-[13px] text-foreground rounded-md focus:bg-muted ${sortBy === "market_cap_desc" ? "bg-accent font-semibold" : ""}`}
            onClick={handleCapDescClick}
          >
            <img src={DownArrowIcon} className="size-4 opacity-70" />
            Descending
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-muted my-1" />
        {/* ===== VOLUME GROUP ===== */}
        <DropdownMenuLabel className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground px-2.5 py-1">
          Volume
        </DropdownMenuLabel>
        <DropdownMenuItem
          className={`cursor-pointer px-2.5 py-2 text-[13px] text-foreground rounded-md focus:bg-muted ${sortBy === "volume_asc" ? "bg-accent font-semibold" : ""}`}
          onClick={handleVolAscClick}
        >
          <img src={UpArrowIcon} className="size-4 opacity-70" />
          Ascending
        </DropdownMenuItem>
        <DropdownMenuItem
          className={`cursor-pointer px-2.5 py-2 text-[13px] text-foreground rounded-md focus:bg-muted ${sortBy === "volume_desc" ? "bg-accent font-semibold" : ""}`}
          onClick={handleVolDescClick}
        >
          <img src={DownArrowIcon} className="size-4 opacity-70" />
          Descending
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
