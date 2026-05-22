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
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import NewTradeButton from "./NewTrade/NewTradeButton";
import { loadAllCoinsList } from "@/loadAllCoinsList";
import CustomSkeleton from "./CustomSkeleton";
import { numToMoney } from "@/utils";
import ProfileAvatar from "./Dashboard/Feed/ProfileAvatar";

// ===== API FUNCTIONS =====
async function fetchTotalPortfolioValue() {
  const response = await fetch(
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
      queryKey: ["all-coins-list"],
      queryFn: loadAllCoinsList,
    });
  };

  const portfolioTotalValueQuery = useQuery({
    queryKey: ["total-portfolio-value"],
    queryFn: fetchTotalPortfolioValue,
  });

  const logoutMutation = useMutation({
    mutationFn: () =>
      axios.get("http://localhost:5000/logout", {
        withCredentials: true,
      }),

    onSuccess: () => {
      queryClient.setQueryData(["auth", "me"], null);
      navigate("/login");
    },
  });

  return (
    <div className="sticky top-0 z-10 bg-white flex justify-between items-center py-5 px-10 border-b border-[#f0f0f0]">
      {/* ===== PORTFOLIO VALUE ===== */}
      {portfolioTotalValueQuery.isLoading && (
        <CustomSkeleton className="h-8 w-60" />
      )}
      {portfolioTotalValueQuery.data && (
        <div
          className="flex flex-col gap-1.5 cursor-pointer"
          onClick={() => navigate("/my_trades")}
        >
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500 leading-none">
            Portfolio Value
          </span>
          <p className="font-mono text-[22px] font-semibold tracking-[-0.02em] leading-none">
            ${numToMoney(portfolioTotalValueQuery.data)}
          </p>
        </div>
      )}

      {/* ===== NAVIGATION LINKS ===== */}
      <NavigationMenu>
        <NavigationMenuList className="gap-1">
          <NavigationMenuItem>
            <NavigationMenuLink asChild className="cursor-pointer">
              <NavLink to="/dashboard">
                {({ isActive }) => (
                  <div
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-mono text-[13px] font-semibold uppercase tracking-[0.06em] leading-none transition-colors ${
                      isActive
                        ? "text-zinc-900 bg-zinc-100"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
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
            <NavigationMenuLink asChild className="cursor-pointer">
              <NavLink to="/my_trades">
                {({ isActive }) => (
                  <div
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-mono text-[13px] font-semibold uppercase tracking-[0.06em] leading-none transition-colors ${
                      isActive
                        ? "text-zinc-900 bg-zinc-100"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
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
            <NavigationMenuLink asChild className="cursor-pointer">
              <NavLink to="/top_coins">
                {({ isActive }) => (
                  <div
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-mono text-[13px] font-semibold uppercase tracking-[0.06em] leading-none transition-colors ${
                      isActive
                        ? "text-zinc-900 bg-zinc-100"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
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
            <NavigationMenuLink asChild className="cursor-pointer">
              <NavLink to="/coin_info">
                {({ isActive }) => (
                  <div
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-mono text-[13px] font-semibold uppercase tracking-[0.06em] leading-none transition-colors ${
                      isActive
                        ? "text-zinc-900 bg-zinc-100"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
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
        {/* ===== USER + AVATAR GROUP ===== */}
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer flex gap-2 items-center outline-none pl-1.5 pr-3 py-1 rounded-lg border border-[#f0f0f0] bg-white hover:bg-zinc-50 transition-colors">
            {user?.username ? (
              <ProfileAvatar letter={user.username} size={50} />
            ) : (
              <div></div>
            )}
            <p className="text-base font-semibold tracking-[-0.01em] text-zinc-900 leading-none">
              {user?.username}
            </p>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={0}
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
