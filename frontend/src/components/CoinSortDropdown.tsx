import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type ApiSorts } from "@/pages/TopCoins";

import UpArrowIcon from "@/assets/icons/arrow-up.svg";
import DownArrowIcon from "@/assets/icons/arrow-down.svg";

type CoinSortDropdownProps = {
  sortBy: ApiSorts;
  setSortBy: React.Dispatch<React.SetStateAction<ApiSorts>>;
};

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
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="cursor-pointer w-56">
          <img
            src={
              sortBy === "market_cap_asc" || sortBy == "volume_asc"
                ? UpArrowIcon
                : DownArrowIcon
            }
            className="size-6"
          />
          {sortByMap[sortBy]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Market Cap</DropdownMenuLabel>
          <DropdownMenuItem
            className="cursor-pointer pt-1 pb-1"
            onClick={handleCapAscClick}
          >
            <img src={UpArrowIcon} className="size-6" />
            Ascending
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer pt-1 pb-1"
            onClick={handleCapDescClick}
          >
            <img src={DownArrowIcon} className="size-6" />
            Descending
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Volume</DropdownMenuLabel>
        <DropdownMenuItem
          className="cursor-pointer pt-1 pb-1"
          onClick={handleVolAscClick}
        >
          <img src={UpArrowIcon} className="size-6" />
          Ascending
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer pt-1 pb-1"
          onClick={handleVolDescClick}
        >
          <img src={DownArrowIcon} className="size-6" />
          Descending
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
