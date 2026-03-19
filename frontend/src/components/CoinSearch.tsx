import { useQuery } from "@tanstack/react-query";
import axios from "axios";

async function fetchCoins() {
  const res = await axios.get("http://127.0.0.1:5000/get_all_coin_names");
  return res.data;
}

export default function CoinSearch() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["coins"],
    queryFn: fetchCoins,
  });
}
