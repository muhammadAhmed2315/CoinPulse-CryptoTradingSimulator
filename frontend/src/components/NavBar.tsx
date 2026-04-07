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
import PlaceHolderIcon from "@/assets/icons/placeholder.svg";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import NewTradeButton from "@/components/NewTradeButton";
import { loadAllCoinsList } from "@/loadAllCoinsList";

export default function NavBar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const prefetchAllCoinsList = async () => {
    await queryClient.prefetchQuery({
      queryKey: ["all-coins-list"],
      queryFn: loadAllCoinsList,
    });
  };

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
    <div className="flex justify-between items-center text-lg p-6 mr-4 ml-4">
      <h1>Portfolio Value: $1,214,865.16</h1>

      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink asChild className="cursor-pointer text-lg">
              <NavLink to="/dashboard">
                <div className="flex gap-1">
                  <img src={HomeIcon} />
                  <p>Home</p>
                </div>
              </NavLink>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink asChild className="cursor-pointer text-lg">
              <NavLink to="/my_trades">
                <div className="flex gap-1">
                  <img src={BarChartIcon} />
                  <p>My Trades</p>
                </div>
              </NavLink>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink asChild className="cursor-pointer text-lg">
              <NavLink to="/top_coins">
                <div className="flex gap-1">
                  <img src={LineChartAscendingIcon} />
                  <p>Top Coins</p>
                </div>
              </NavLink>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink className="cursor-pointer text-lg">
              <div className="flex gap-1">
                <img src={InfoIcon} />
                <p>Coin Info</p>
              </div>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <div className="flex gap-4 items-center">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex gap-2 items-center cursor-pointer outline-none">
            <img src={PlaceHolderIcon} className="size-11.25" />
            <p>{user?.username}</p>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="cursor-pointer text-base"
              onClick={() => logoutMutation.mutate()}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <NewTradeButton prefetchFn={prefetchAllCoinsList} />
      </div>
    </div>
  );
}
