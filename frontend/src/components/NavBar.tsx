import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "./ui/button";

import HomeIcon from "@/assets/icons/home.svg";
import InfoIcon from "@/assets/icons/info.svg";
import BarChartIcon from "@/assets/icons/bar-chart.svg";
import LineChartAscendingIcon from "@/assets/icons/line-chart-ascending.svg";
import PlaceHolderIcon from "@/assets/icons/placeholder.svg";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";

export default function NavBar() {
  const navigate = useNavigate();

  const logoutMutation = useMutation({
    mutationFn: () =>
      axios.get("http://127.0.0.1:5000/logout", {
        withCredentials: true,
      }),

    onSuccess: () => {
      console.log("SUCCESS");
      navigate("/login");
    },
  });

  async function handleLogout(): Promise<void> {
    logoutMutation.mutate();
  }

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

      <div className="flex gap-3 items-center">
        <img src={PlaceHolderIcon} className="cursor-pointer size-11.25" />
        <p>muhahmed3758</p>
        <div className="h-6 w-px bg-gray-400" />
        <Button
          variant="ghost"
          className="cursor-pointer text-lg"
          onClick={handleLogout}
        >
          Log out
        </Button>
      </div>
    </div>
  );
}
