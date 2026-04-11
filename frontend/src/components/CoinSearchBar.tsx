import type { Coin } from "@/loadAllCoinsList";
import { useCallback, useState } from "react";

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
  const [showDropdown, setShowDropdown] = useState(false);

  const coinMatching = useCallback(() => {
    if (debouncedQuery === "") return [];
    return coins.filter((c) => c.name.toLowerCase().startsWith(debouncedQuery));
  }, [coins, debouncedQuery]);

  const matchingCoins = coinMatching();

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
      <input
        className="bg-white rounded-md border border-black p-3"
        placeholder="Search for coins..."
        value={query}
        onChange={handleSearchInput}
      ></input>
      <div className="absolute top-full left-0 w-full z-10">
        {showDropdown &&
          matchingCoins.slice(0, 10).map((c) => (
            <div
              className="flex justify-between rounded-md px-2 py-0.5 cursor-pointer hover:bg-gray-200 bg-white"
              onClick={() => handleDropdownItemClick(c)}
            >
              <div className="flex gap-1.5">
                <img className="rounded-3xl size-7" src={c.imgUrl} />
                <p>{c.name}</p>
              </div>
              <p>{c.ticker}</p>
            </div>
          ))}
      </div>
    </div>
  );
}
