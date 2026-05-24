import { useQueryClient } from "@tanstack/react-query";

export function useInvalidateTradeQueries() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      // User's USD balance and coin balance
      queryClient.invalidateQueries({ queryKey: ["coinBalance"] }),
      queryClient.invalidateQueries({ queryKey: ["userBalance"] }),

      // Dashboard queries
      queryClient.invalidateQueries({ queryKey: ["privateFeedPosts"] }),
      queryClient.invalidateQueries({ queryKey: ["globalFeedPosts"] }),
      queryClient.invalidateQueries({ queryKey: ["totalPortfolioValue"] }),
      queryClient.invalidateQueries({ queryKey: ["walletAssets"] }),
      queryClient.invalidateQueries({ queryKey: ["openTrades"] }),

      // My Trades queries
      queryClient.invalidateQueries({ queryKey: ["portfolioHistory"] }),
      queryClient.invalidateQueries({ queryKey: ["tradeHistory"] }),
      queryClient.invalidateQueries({ queryKey: ["tradeFilterCounts"] }),
    ]);
}
