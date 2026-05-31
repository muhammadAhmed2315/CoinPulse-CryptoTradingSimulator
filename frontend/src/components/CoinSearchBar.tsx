import type { Coin } from "@/loadAllCoinsList";
import { useCallback, useState } from "react";
import { Field } from "./ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { SearchIcon } from "lucide-react";
import { type QueryClient } from "@tanstack/react-query";
import CoinSearchResult from "./CoinSearchResult";

// ===== TYPES =====
type CoinSearchBarProps = {
  coins: Coin[];
  debouncedQuery: string;
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  setCurrCoin: React.Dispatch<React.SetStateAction<Coin>>;
  prefetchFn?: (queryClient: QueryClient, coin: Coin) => any;
};

export default function CoinSearchBar({
  coins,
  debouncedQuery,
  setQuery,
  query,
  setCurrCoin,
  prefetchFn,
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
            placeholder="Search by name or $TICKER..."
            value={query}
            onChange={handleSearchInput}
          />
          <InputGroupAddon align="inline-start">
            <SearchIcon className="text-muted-foreground" />
          </InputGroupAddon>
        </InputGroup>
      </Field>

      {/* ===== RESULTS DROPDOWN ===== */}
      <div className="absolute top-full left-0 w-full z-10 bg-background overflow-hidden rounded-md">
        {showDropdown &&
          matchingCoins
            .slice(0, 10)
            .map((c) => (
              <CoinSearchResult
                key={c.id}
                coin={c}
                onDropdownItemClick={handleDropdownItemClick}
                prefetchFn={prefetchFn}
              />
            ))}
      </div>
    </div>
  );
}
