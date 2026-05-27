import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import HomeIcon from "@/assets/icons/home.svg";
import InfoIcon from "@/assets/icons/info.svg";
import BarChartIcon from "@/assets/icons/bar-chart.svg";
import LineChartAscendingIcon from "@/assets/icons/line-chart-ascending.svg";
import ErrorFallback from "./ErrorFallback";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import NewTradeButton from "./NewTrade/NewTradeButton";
import { loadAllCoinsList } from "@/loadAllCoinsList";
import CustomSkeleton from "./CustomSkeleton";
import { numToMoney } from "@/utils";
import ProfileAvatar from "./Dashboard/Feed/ProfileAvatar";
import { prefetchTopCoins } from "@/pages/TopCoins";
import { prefetchCoinInfo } from "@/pages/CoinInfo";
import { prefetchDashboard } from "@/pages/Dashboard";
import { prefetchMyTrades } from "@/pages/MyTrades";
import { fetchWithRefresh } from "@/lib/api";
import ThemeToggle from "./ThemeToggle";

// ===== API FUNCTIONS =====
async function fetchTotalPortfolioValue() {
  const response = await fetchWithRefresh(
    "http://localhost:5000/get_wallet_total_current_value",
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) throw await response.json();

  return await response.json();
}

export default function NavBar() {
  // ===== STATE VARIABLES =====
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // ===== REACT QUERY HOOKS =====
  const prefetchAllCoinsList = async () => {
    await queryClient.prefetchQuery({
      queryKey: ["allCoinsList"],
      queryFn: loadAllCoinsList,
    });
  };

  const portfolioTotalValueQuery = useQuery({
    queryKey: ["totalPortfolioValue"],
    queryFn: fetchTotalPortfolioValue,
  });

  const logoutMutation = useMutation({
    mutationFn: () =>
      axios.get("http://localhost:5000/logout", {
        withCredentials: true,
      }),

    onSuccess: () => {
      queryClient.clear();
      navigate("/login");
    },
  });

  return (
    <div className="sticky top-0 z-10 bg-background flex justify-between items-center py-5 px-10 border-b border-border">
      {/* ===== PORTFOLIO VALUE ===== */}
      {(() => {
        const isError = portfolioTotalValueQuery.isError;
        if (portfolioTotalValueQuery.isLoading) {
          return <CustomSkeleton className="h-8 w-60" />;
        }
        if (isError) {
          return (
            <ErrorFallback
              horizontal
              size="md"
              title="Data unavailable"
              description="Portfolio value could not be loaded."
              className="w-auto h-auto"
            />
          );
        }
        if (portfolioTotalValueQuery.data) {
          return (
            <div
              className="flex flex-col gap-1.5 cursor-pointer"
              onClick={() => navigate("/my_trades")}
            >
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground leading-none">
                Portfolio Value
              </span>
              <p className="font-mono text-[22px] font-semibold tracking-[-0.02em] leading-none">
                ${numToMoney(portfolioTotalValueQuery.data)}
              </p>
            </div>
          );
        }
        return null;
      })()}

      {/* ===== NAVIGATION LINKS ===== */}
      <NavigationMenu>
        <NavigationMenuList className="gap-1">
          <NavigationMenuItem>
            <NavigationMenuLink
              asChild
              className="cursor-pointer p-0 bg-transparent hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:outline-0"
            >
              <NavLink
                to="/dashboard"
                onFocus={() => {
                  prefetchDashboard(queryClient);
                }}
                onMouseEnter={() => {
                  prefetchDashboard(queryClient);
                }}
              >
                {({ isActive }) => (
                  <div
                    className={`flex items-center gap-1.5 px-5 py-4 rounded-md font-mono text-[13px] font-semibold uppercase tracking-[0.06em] leading-none transition-colors ${
                      isActive
                        ? "text-foreground bg-accent"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <img src={HomeIcon} className="size-4 opacity-80" />
                    <p>Home</p>
                  </div>
                )}
              </NavLink>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink
              asChild
              className="cursor-pointer p-0 bg-transparent hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:outline-0"
            >
              <NavLink
                to="/my_trades"
                onFocus={() => {
                  prefetchMyTrades(queryClient);
                }}
                onMouseEnter={() => {
                  prefetchMyTrades(queryClient);
                }}
              >
                {({ isActive }) => (
                  <div
                    className={`flex items-center gap-1.5 px-5 py-4 rounded-md font-mono text-[13px] font-semibold uppercase tracking-[0.06em] leading-none transition-colors ${
                      isActive
                        ? "text-foreground bg-accent"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <img src={BarChartIcon} className="size-4 opacity-80" />
                    <p>My Trades</p>
                  </div>
                )}
              </NavLink>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink
              asChild
              className="cursor-pointer p-0 bg-transparent hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:outline-0"
            >
              <NavLink
                to="/top_coins"
                onFocus={() => {
                  prefetchTopCoins(queryClient);
                }}
                onMouseEnter={() => {
                  prefetchTopCoins(queryClient);
                }}
              >
                {({ isActive }) => (
                  <div
                    className={`flex items-center gap-1.5 px-5 py-4 rounded-md font-mono text-[13px] font-semibold uppercase tracking-[0.06em] leading-none transition-colors ${
                      isActive
                        ? "text-foreground bg-accent"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <img
                      src={LineChartAscendingIcon}
                      className="size-4 opacity-80"
                    />
                    <p>Top Coins</p>
                  </div>
                )}
              </NavLink>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink
              asChild
              className="cursor-pointer p-0 bg-transparent hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:outline-0"
            >
              <NavLink
                to="/coin_info"
                onFocus={() => {
                  prefetchCoinInfo(queryClient);
                }}
                onMouseEnter={() => {
                  prefetchCoinInfo(queryClient);
                }}
              >
                {({ isActive }) => (
                  <div
                    className={`flex items-center gap-1.5 px-5 py-4 rounded-md font-mono text-[13px] font-semibold uppercase tracking-[0.06em] leading-none transition-colors ${
                      isActive
                        ? "text-foreground bg-accent"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <img src={InfoIcon} className="size-4 opacity-80" />
                    <p>Coin Info</p>
                  </div>
                )}
              </NavLink>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      {/* ===== USER MENU & NEW TRADE ===== */}
      <div className="flex gap-4 items-center justify-center">
        {/* ===== THEME TOGGLE ===== */}
        <ThemeToggle />

        {/* ===== USER + AVATAR GROUP ===== */}
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer flex gap-2 items-center outline-none pl-1.5 pr-3 py-1 rounded-lg border border-border bg-background hover:bg-accent transition-colors">
            {user?.username ? (
              <ProfileAvatar letter={user.username} size={50} />
            ) : (
              <div></div>
            )}
            <p className="text-base font-semibold tracking-[-0.01em] text-foreground leading-none">
              {user?.username}
            </p>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="z-100 w-(--radix-dropdown-menu-trigger-width) min-w-0 p-0"
          >
            <DropdownMenuItem
              className="cursor-pointer font-mono text-[13px] font-semibold uppercase tracking-[0.06em] justify-center py-2.5"
              onClick={() => logoutMutation.mutate()}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* ===== NEW TRADE BUTTON ===== */}
        <NewTradeButton prefetchFn={prefetchAllCoinsList} />
      </div>
    </div>
  );
}
