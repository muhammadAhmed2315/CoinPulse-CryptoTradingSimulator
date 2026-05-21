import type { Coin } from "@/loadAllCoinsList";
import { useCallback, useState } from "react";
import { Field } from "./ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { SearchIcon } from "lucide-react";

// ===== TYPES =====
type CoinSearchBarProps = {
  coins: Coin[];
  debouncedQuery: string;
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  setCurrCoin: React.Dispatch<React.SetStateAction<Coin>>;
};

export default function CoinSearchBar({
  coins,
  debouncedQuery,
  setQuery,
  query,
  setCurrCoin,
}: CoinSearchBarProps) {
  // ===== STATE VARIABLES =====
  const [showDropdown, setShowDropdown] = useState(false);

  // ===== DERIVED STATE =====
  const coinMatching = useCallback(() => {
    if (debouncedQuery === "") return [];

    // Search by ticker
    if (debouncedQuery.startsWith("$"))
      return coins.filter((c) =>
        c.ticker.toLowerCase().startsWith(debouncedQuery.slice(1)),
      );

    // Search by name
    return coins.filter((c) => c.name.toLowerCase().startsWith(debouncedQuery));
  }, [coins, debouncedQuery]);

  const matchingCoins = coinMatching();

  // ===== EVENT HANDLERS =====
  function handleSearchInput(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setShowDropdown(true);
  }

  function handleDropdownItemClick(c: Coin) {
    setQuery(c.name);
    setShowDropdown(false);
    setCurrCoin(c);
  }

  return (
    <div className="relative flex flex-col gap-1">
      {/* ===== SEARCH INPUT ===== */}
      <Field className="max-w-sm">
        <InputGroup>
          <InputGroupInput
            placeholder="Search by name or $ticker..."
            value={query}
            onChange={handleSearchInput}
          />
          <InputGroupAddon align="inline-start">
            <SearchIcon className="text-muted-foreground" />
          </InputGroupAddon>
        </InputGroup>
      </Field>

      {/* ===== RESULTS DROPDOWN ===== */}
      <div className="absolute top-full left-0 w-full z-10 bg-white overflow-hidden rounded-md">
        {showDropdown &&
          matchingCoins.slice(0, 10).map((c) => (
            <div
              className="flex justify-between rounded-md px-2 py-0.5 cursor-pointer hover:bg-gray-200 bg-white gap-2"
              onClick={() => handleDropdownItemClick(c)}
            >
              <div className="flex gap-1.5 min-w-0">
                <img className="rounded-3xl size-7 shrink-0" src={c.imgUrl} />
                <p className="truncate">{c.name}</p>
              </div>
              <p className="uppercase shrink-0">${c.ticker}</p>
            </div>
          ))}
      </div>
    </div>
  );
}
