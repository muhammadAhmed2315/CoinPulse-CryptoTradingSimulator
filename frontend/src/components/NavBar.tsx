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
    <div className="sticky top-0 z-100 bg-white flex justify-between items-center text-lg py-6 px-10 border-b border-[#f0f0f0]">
      {/* ===== PORTFOLIO VALUE ===== */}
      {portfolioTotalValueQuery.isLoading && (
        <CustomSkeleton className="h-8 w-60" />
      )}
      {portfolioTotalValueQuery.data && (
        <h1 className="font-semibold">
          Portfolio Value: ${numToMoney(portfolioTotalValueQuery.data)}
        </h1>
      )}

      {/* ===== NAVIGATION LINKS ===== */}
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink asChild className="cursor-pointer text-lg">
              <NavLink to="/dashboard">
                {({ isActive }) => (
                  <div className={`flex gap-1 ${isActive ? "font-bold" : ""}`}>
                    <img src={HomeIcon} />
                    <p>Home</p>
                  </div>
                )}
              </NavLink>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink asChild className="cursor-pointer text-lg">
              <NavLink to="/my_trades">
                {({ isActive }) => (
                  <div className={`flex gap-1 ${isActive ? "font-bold" : ""}`}>
                    <img src={BarChartIcon} />
                    <p>My Trades</p>
                  </div>
                )}
              </NavLink>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink asChild className="cursor-pointer text-lg">
              <NavLink to="/top_coins">
                {({ isActive }) => (
                  <div className={`flex gap-1 ${isActive ? "font-bold" : ""}`}>
                    <img src={LineChartAscendingIcon} />
                    <p>Top Coins</p>
                  </div>
                )}
              </NavLink>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink asChild className="cursor-pointer text-lg">
              <NavLink to="/coin_info">
                {({ isActive }) => (
                  <div className={`flex gap-1 ${isActive ? "font-bold" : ""}`}>
                    <img src={InfoIcon} />
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
        {/* ===== USER DROPDOWN ===== */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex gap-2 items-center cursor-pointer outline-none">
            {user?.username ? (
              <ProfileAvatar letter={user.username} />
            ) : (
              <div></div>
            )}

            <p>{user?.username}</p>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-100">
            <DropdownMenuItem
              className="cursor-pointer text-base"
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
