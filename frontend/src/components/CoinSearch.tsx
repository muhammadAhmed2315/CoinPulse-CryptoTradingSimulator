import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// ===== API FUNCTIONS =====
async function fetchCoins() {
  const res = await axios.get("http://localhost:5000/get_all_coin_names");
  return res.data;
}

export default function CoinSearch() {
  // ===== REACT QUERY HOOKS =====
  const { data, isLoading, error } = useQuery({
    queryKey: ["coins"],
    queryFn: fetchCoins,
  });
}
