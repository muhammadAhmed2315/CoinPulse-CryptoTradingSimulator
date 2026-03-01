import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

import HomeIcon from "@/assets/icons/home.svg";
import InfoIcon from "@/assets/icons/info.svg";
import BarChartIcon from "@/assets/icons/bar-chart.svg";
import LineChartAscendingIcon from "@/assets/icons/line-chart-ascending.svg";
import PlaceHolderIcon from "@/assets/icons/placeholder.svg";
import { Button } from "./ui/button";

export default function NavBar() {
  return (
    <div className="flex justify-between items-center text-lg pt-2 pb-2">
      <h1>Portfolio Value: $1,214,865.16</h1>

      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink className="cursor-pointer text-lg">
              <div className="flex gap-1">
                <img src={HomeIcon} />
                <p>Home</p>
              </div>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink className="cursor-pointer text-lg">
              <div className="flex gap-1">
                <img src={BarChartIcon} />
                <p>My Trades</p>
              </div>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink className="cursor-pointer text-lg">
              <div className="flex gap-1">
                <img src={LineChartAscendingIcon} />
                <p>Top Coin</p>
              </div>
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

      <div className="flex gap-1 items-center">
        <img src={PlaceHolderIcon} className="cursor-pointer" />
        <p>muhahmed3758</p>
        <Button variant="ghost" className="cursor-pointer text-lg">
          Log out
        </Button>
      </div>
    </div>
  );
}
