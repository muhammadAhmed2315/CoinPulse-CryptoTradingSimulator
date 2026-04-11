import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import NewTradeCardLeft, {
  type NewTradeCardLeftProps,
} from "./NewTradeCardLeft";
import type { NewTradeCardRightProps } from "./NewTradeCardRight";
import { loadAllCoinsList, type Coin } from "@/loadAllCoinsList";
import NewTradeCardRight from "./NewTradeCardRight";
import CoinSearchBar from "../CoinSearchBar";
import BitcoinLogo from "../../assets/logos/bitcoin.png";

export type OrderSide = "BUY" | "SELL";
export type OrderType = "MARKET" | "LIMIT" | "STOP";
/** Fraction of the user's available balance to use for an order (e.g. 0.25 = 25%). Undefined when no percentage is selected. */
export type BalancePercentage = 0.1 | 0.25 | 0.5 | 0.75 | 1 | undefined;

/**
 * Fetches detailed information about a coin from the backend. E.g., price, 24h high +
 * low, percentage change, etc.
 * @throws {Error} Parsed JSON error body if the request fails.
 */
async function getCoinInfo(coinId: string) {
  const response = await fetch(
    `http://localhost:5000/get_coin_data/${coinId}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) throw await response.json();

  return await response.json();
}

/**
 * Fetches recent price history of the coin from the backend, displayed to the user as
 * a sparkline graph.
 * @throws {Error} Parsed JSON error body if the request fails.
 */
async function getCoinSparkline(coinId: string) {
  const response = await fetch(
    `http://localhost:5000/get_coin_sparkline/${coinId}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) throw await response.json();

  return await response.json();
}

/**
 * Fetches the user's current balance (in USD) from the backend.
 * @throws {Error} Parsed JSON error body if the request fails.
 */
async function getUserBalance() {
  const response = await fetch("http://localhost:5000/get_user_balance", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) throw await response.json();

  return await response.json();
}

/**
 * Fetches the user's balance for a specific coin from the backend.
 * @throws {Error} Parsed JSON error body if the request fails.
 */
async function getCoinBalance(coinId: string) {
  const response = await fetch(
    `http://localhost:5000/get_coin_balance/${coinId}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) throw await response.json();

  return await response.json();
}

export default function NewTradeCard() {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query.toLowerCase(), 300);
  const [currCoin, setCurrCoin] = useState<Coin>({
    id: "bitcoin",
    name: "Bitcoin",
    ticker: "btc",
    imgUrl: BitcoinLogo,
  });

  const allCoinsQuery = useQuery({
    queryKey: ["all-coins-list"],
    queryFn: loadAllCoinsList,
  });

  const coinDataQuery = useQuery({
    queryKey: ["coin-info", currCoin.id],
    queryFn: () => getCoinInfo(currCoin.id),
  });

  const sparklineQuery = useQuery({
    queryKey: ["coin-sparkline", currCoin.id],
    queryFn: () => getCoinSparkline(currCoin.id),
  });

  const userBalanceQuery = useQuery({
    queryKey: ["user-balance"],
    queryFn: () => getUserBalance(),
  });

  const coinBalanceQuery = useQuery({
    queryKey: ["coin-balance", currCoin.id],
    queryFn: () => getCoinBalance(currCoin.id),
  });

  const leftCardProps: NewTradeCardLeftProps = {
    coinDataQuery,
    sparklineQuery,
    userBalanceQuery,
    coinBalanceQuery,
    currCoin,
  };

  const rightCardProps: NewTradeCardRightProps = {
    userBalanceQuery,
    coinDataQuery,
    coinBalanceQuery,
    currCoin,
  };

  return (
    <>
      <div className="flex-1 bg-[#fafafa] border-r-gray-100 border-r rounded-l-md p-4">
        <div className="mb-4">
          {allCoinsQuery.isLoading ? (
            <>Loading...</>
          ) : (
            <CoinSearchBar
              coins={allCoinsQuery.data!}
              query={query}
              setQuery={setQuery}
              debouncedQuery={debouncedQuery}
              setCurrCoin={setCurrCoin}
            />
          )}
        </div>
        <NewTradeCardLeft {...leftCardProps} />
      </div>

      <NewTradeCardRight {...rightCardProps} />
    </>
  );
}
